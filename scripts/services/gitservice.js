import ConfigurationService from "./configuration-service.js";
export default class GithubService {
    constructor(){
        this.configurationService=new ConfigurationService();
        this.submissionInProgress=false;
        this.problem=null;
        this.comment="";
        this.instanceId=crypto.randomUUID();
    }
    async init(){
        try{
            console.log("[GithubService.init] Starting initialization...");
            
            this.userConfig=await this.configurationService.getChromeStorageConfig([
                "leetcode_tracker_repo",
                "leetcode_tracker_username",
                "leetcode_tracker_token"
            ]);
            
            console.log("[GithubService.init] User config retrieved:", {
                username: this.userConfig?.leetcode_tracker_username ? '***' : 'MISSING',
                repo: this.userConfig?.leetcode_tracker_repo,
                token: this.userConfig?.leetcode_tracker_token ? '***' : 'MISSING'
            });
            
            this.dataConfig=await this.configurationService.getDataConfig();
            
            console.log("[GithubService.init] Data config retrieved:", {
                REPOSITORY_URL: this.dataConfig?.REPOSITORY_URL,
                hasHeaders: !!this.dataConfig?.HEADERS
            });
            
            // Validate configuration
            if(!this.userConfig.leetcode_tracker_username){
                throw new Error("GitHub username not configured");
            }
            if(!this.userConfig.leetcode_tracker_repo){
                throw new Error("GitHub repository not configured");
            }
            if(!this.userConfig.leetcode_tracker_token){
                throw new Error("GitHub token not configured");
            }
            if(!this.dataConfig || !this.dataConfig.REPOSITORY_URL){
                throw new Error("Data configuration not found");
            }
            
            console.log("[GithubService.init] All validations passed");
            
            const result = await chrome.storage.local.get(
                "leetcode_tracker_sync_multiple_submission"
            );
            this.syncMultipleSubmissionsSettingEnabled =
                result.leetcode_tracker_sync_multiple_submission === true;
            console.log("✅ GitHub service initialized successfully");
        } catch(error){
            console.error("❌ GitHub service initialization failed:", error);
            throw error;
        }
    }
    async submitToGitHub(problem,comment=""){
        await this.init();
        //Del
        if (
    !problem ||
    !problem.slug ||
    !problem.code ||
    !problem.language?.extension
  ) {
    console.warn("❌ SYNC BLOCKED — Incomplete problem data", problem);
    return;
  }
        this.problem=problem;
        this.comment=comment;
        if(this.submissionInProgress||
            !this.configurationService.isConfigValid(this.userConfig)
        ){
            return;
        }
        this.submissionInProgress=true;
    try{
        const fileExists= await this.checkFileExistence();
        if(fileExists && !this.syncMultipleSubmissionsSettingEnabled){
            const currentContent=atob(fileExists.content);
            const newContent=this.getFormattedCode();
            const result =await this.configurationService.getChromeStorageConfig(["leetcode_tracker_code_submit"]);
            const skipDuplicates=result.leetcode_tracker_code_submit;
            const contentIsSame=!(await this.contentsDiffer(
                currentContent,
                newContent
            ));
            if(skipDuplicates && contentIsSame){
                return;
            }
            await this.updateFile(fileExists);
        }
        else{
            await this.createFile();
        }
    } finally{
        this.submissionInProgress=false;
    }

        }
    async updateFile(existingFile){
        const url=this.buildGitHubUrl(false);
        const currentDate = new  Date().toLocaleString();
        const bodyLog={
            message: `File updated at ${currentDate}`,
            content: this.utf8ToBase64(this.getFormattedCode()),
            sha: existingFile.sha,
        };
        const response= await this.fetchWithAuth(url,"PUT",bodyLog);
        if(!response.ok){
            const errorLog = await response.json().catch(()=>({}));
            throw new Error(`Failed to update file: ${response.status}-${
                errorLog.message || "Unknow error"
            }`);

        }
        return response;
    }
async createFile(isSyncing=false){
    if(!this.problem){
        throw new Error("Unable to create a New File: No problem set");
    }
    if(!this.problem.language || !this.problem.language.extension){
        throw new Error("Unable to create file: Missing language information");
    }
    if(!this.problem.code){
        throw new Error("Unable to create file: Missing code content");
    }
    
    const codeUrl = this.buildGitHubUrl(isSyncing);
    const readmeFileUrl = this.buildGitHubUrl(isSyncing,"README.md");

    const codeBodyBlock={
        message:`Create ${this.problem.slug}`,
        content: this.utf8ToBase64(this.getFormattedCode()),
    };
    try{
        console.log(`Creating file: ${codeUrl}`);
        const result = await this.fetchWithAuth(codeUrl,"PUT",codeBodyBlock);
        if(!result.ok){
            const errorLog = await result.json().catch(()=>({}));
            if(result.status===422 &&
                errorLog.message?.includes("already exists")
            ){
                console.log(`File already exists: ${this.problem.slug}`);
                return result;
            }
            throw new Error(`Failed to create file: ${result.status} - ${errorLog.message || "Unknown error"}`);
        }
    
        await result.json();

        if(result.status === 201){
            console.log(`✅ File created successfully: ${this.problem.slug}`);
            try{
                if(this.problem.description && this.problem.description.trim()){
                    const readmeBodyLog={
                        message: `Add README for ${this.problem.slug}`,
                        content: this.utf8ToBase64(this.problem.description),
                    };
                    const readmeResultLog=await this.fetchWithAuth(readmeFileUrl,
                        "PUT",
                        readmeBodyLog
                    );
                    if(!readmeResultLog.ok){
                        console.debug('Readme File Creation Failed')
                    }
                }
            }
            catch(readmeErrorLog){
                console.error("Error creating README:", readmeErrorLog);
            }
            finally{
                if(!isSyncing){
                    try{
                        console.log(`Broadcasting stats update for difficulty: ${this.problem.difficulty}`);
                        chrome.runtime.sendMessage({
                            type: "updateDifficultyStats",
                            difficulty: this.problem.difficulty,
                        });
                    }
                    catch(ErrorLog){
                        console.error("Failed to send stats update:", ErrorLog);
                    }
                }
            }
        }
        return result;
    }
    catch(errorLog){
        console.error(`Error in createFile for ${this.problem.slug}:`, errorLog);
        throw errorLog;
    }
}
async contentsDiffer(currentContent, newContent) {
    const normalize = (content) =>
      content.trim().replace(/\r\n/g, "\n").replace(/\s+/g, " ");
    return normalize(currentContent) !== normalize(newContent);
  }
    async checkFileExistence(isSyncing=false){
        if (!this.problem){
            throw new Error("No problem set for File existence check");
        }
        const url = this.buildGitHubUrl(isSyncing);
        try{
            const response = await this.fetchWithAuth(url,"GET");
            if(response.ok){
                return await response.json();
            }
            else if(response.status===404){
                return null;
            }
            else{
                const errorData = await response.json().catch(()=>{});
                throw new Error(
                    `Failed to check file existence: ${response.status} - ${errorData.message || "Unknown Error"}`
                );
            }
        }
            catch(error){
                throw error;
            }
        }
getFormattedCode(){
    if(!this.problem||!this.problem.code){
        throw new Error("No Problem or Code is Available to formatting");
    }
    const currentDate=new Date().toLocaleString();
    const commentFormat=this.getCommentFormat(this.problem.language.extension);
    let header = `${commentFormat.line} Last Updated: ${currentDate}\n`;

    if(this.comment && this.comment.trim()){
        if(this.comment.includes("\n")){
            header+=`${commentFormat.start}\n`;
            this.comment.split("\n").forEach((line)=>{
                header+=`${commentFormat.linePrefix}${line}\n`;
            });
            header+=`${commentFormat.end}\n\n`;
        }
        else{
            header+=`${commentFormat.line} ${this.comment}\n`
        }
    }
    return header+this.problem.code;
}


getCommentFormat(extension){
        switch (extension){
            case ".py":
                return {
                    line: '#',
                    start:"'''",
                    end: "'''",
                    linePrefix: "",
                };
            case ".rb":
                return{
                    line: "#",
                    start: "=begin",
                    end: "=end",
                    linePrefix: "",
                };
            case ".php":
            case ".js":
            case ".ts":
            case ".kt":
            case ".java":
            case ".c":
            case ".cpp":
            case ".cs":
            case ".swift":
            case ".scala":
            case ".dart":
            case ".go":
            case ".rs":
                return {
                line: "//",
                start: "/*",
                end: "*/",
                linePrefix: " * ",
                };
                  case ".ex":
                return {
                line: "#",
                start: '@doc """',
                end: '"""',
                linePrefix: "",
                };
            case ".erl":
                return {
                line: "%",
                start: "%% ---",
                end: "%% ---",
                linePrefix: "%% ",
                };
            case ".rkt":
                return {
                line: ";",
                start: "#|",
                end: "|#",
                linePrefix: " ",
                };
            case ".sql":
                return {
                line: "--",
                start: "/*",
                end: "*/",
                linePrefix: " * ",
                };
            default:
                return {
                line: "//",
                start: "/*",
                end: "*/",
                linePrefix: " * ",
                };
            
                }
            }
    utf8ToBase64(string){
        return btoa(
            encodeURIComponent(string).replace(/%([0-9A-F]{2})/g, (match,p1) => 
            String.fromCharCode("0x"+p1))
        );
    }
    buildGitHubUrl(isSyncing,file=""){
        if(!this.problem){
            throw new Error("Cannot build URL: No Problem data found,");
        }
        const username = this.userConfig.leetcode_tracker_username;
        const repo = this.userConfig.leetcode_tracker_repo;
        const baseUrl = this.dataConfig.REPOSITORY_URL;

        const useVersioning =this.syncMultipleSubmissionsSettingEnabled && !isSyncing;
        const timestamp = useVersioning ? `${this.getLocalTimeStamp()}` : "";
        const langPath = useVersioning ? `/version/${this.problem.language.langName}` : "";
        
        const defaultFileName = `${this.problem.slug}${timestamp}${this.problem.language.extension}`;
        const fileName=file || defaultFileName;
        return `${baseUrl}${username}/${repo}/contents/${this.problem.slug}${langPath}/${fileName}`; 
    }
    
    async checkFileExistence(isSyncing = false) {
        try {
            const url = this.buildGitHubUrl(isSyncing);
            const response = await this.fetchWithAuth(url, "GET");
            
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 404) {
                return null;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Failed to check file existence: ${response.status} - ${
                        errorData.message || "Unknown error"
                    }`
                );
            }
        } catch (error) {
            console.error("[GithubService.checkFileExistence] Error:", error);
            throw error;
        }
    }
    
async fetchWithAuth(url, method, body = null) {
  const headers = {
    ...this.dataConfig.HEADERS,
    Authorization: `token ${this.userConfig.leetcode_tracker_token}`,
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error("fetchWithAuth failed:", error);
    throw error;
  }
}

getLocalTimeStamp(){
    let currentStamp=new Date();
    return (
        currentStamp.getFullYear()+
        String(currentStamp.getMonth()+1).padStart(2,"0")+
        String(currentStamp.getDate()).padStart(2,"0")+
        String(currentStamp.getHours()).padStart(2,"0")+
        String(currentStamp.getMinutes()).padStart(2,"0")+
        String(currentStamp.getSeconds()).padStart(2,"0")
    );
}
}
