console.log("[POPUP] Script loading...");

const DOM = {
  authenticate: document.getElementById("authenticate"),
  authenticateButton: document.getElementById("github-authenticate-button"),
  hookgitRepo: document.getElementById("hook-git-repo"),
  authenticated: document.getElementById("authenticated"),
  repoName: document.getElementById("repo-name"),
  repoNameError: document.getElementById("repo-name-error"),
  hookButton: document.getElementById("hook-button"),
  unlinkButton: document.getElementById("unlink-button"),
  repositoryName: document.getElementById("repository-name"),
  repositoryLink: document.getElementById("repository-link"),
  githubUsername: document.getElementById("github-username"),
  logoutButton: document.getElementById("logout-button"),
  changeAccountButton: document.getElementById("change-account-button"),
  checkboxCodeSubmitSetting: document.getElementById("submit-code-checkbox"),
  checkboxSyncMultipleSubmissions: document.getElementById(
    "multiple-submission-checkbox"
  ),
  checkboxCommentSubmission: document.getElementById(
    "comment-submission-checkbox"
  ),
  syncButton: document.getElementById("sync-button"),
  syncStatus: document.getElementById("sync-status"),
  syncTime: document.getElementById("sync-time"),
  stats: {
    easy: document.getElementById("easy"),
    medium: document.getElementById("medium"),
    hard: document.getElementById("hard"),
  },
};
class PopupManager{
  constructor(){
    console.log("[PopupManager] Constructor starting...");
    this.initializeStats();
    this.initEventListeners();
    this.initSettings();
    this.updateSyncStatus();
    this.syncInterval=setInterval(()=>this.updateSyncStatus(),3000);
    console.log("[PopupManager] Constructor completed");
  }
  async initSettings(){
    const{
      leetcode_tracker_code_submit : codesubmit=false,
      leetcode_tracker_sync_multiple_submission: syncMultiple = false,
      leetcode_tracker_comment_submission: commentEnabled = false
    }=await chrome.storage.local.get([
      "leetcode_tracker_code_submit",
      "leetcode_tracker_sync_multiple_submission",
      "leetcode_tracker_comment_submission"
    ]);

    DOM.checkboxCodeSubmitSetting.checked = codesubmit;
    DOM.checkboxSyncMultipleSubmissions.checked = syncMultiple;
    DOM.checkboxCommentSubmission.checked = commentEnabled;

  }
   /* async toggleSyncOldProblemsSetting(){
      const{
        leetcode_tracker_sync_old_problems:current=false
      }=await chrome.storage.local.get("leetcode_tracker_sync_old_problems");
      
      await chrome.storage.local.set({
        leetcode_tracker_sync_old_problems: !current
      });
      
      this.initSettings()

    }*/
    
    async toggleCodeSubmitSettings(){
      const{
        leetcode_tracker_code_submit: codeSubmit=false
      }=await chrome.storage.local.get("leetcode_tracker_code_submit");
      
      await chrome.storage.local.set({leetcode_tracker_code_submit:!codeSubmit})
      
      if(!codeSubmit){
        await chrome.storage.local.set({"leetcode_tracker_comment_submission":false,"leetcode_tracker_sync_multiple_submission":false})
      }
      
      this.initSettings();
    
    }
    
    async toggleSyncMultipleSubmissionSetting(){
      const{
        leetcode_tracker_sync_multiple_submission:multipleSubmit=false
      }=await chrome.storage.local.get("leetcode_tracker_sync_multiple_submission")
      
      await chrome.storage.local.set({"leetcode_tracker_sync_multiple_submission":!multipleSubmit});
      
      if (multipleSubmit){
        await chrome.storage.local.set({"leetcode_tracker_code_submit":false});
      }
      
      else{
        await chrome.storage.local.set({"leetcode_tracker_comment_submission":false});
      }
      
      this.initSettings();
    
    }

    async toggleCommentSubmissionSetting(){
      const{
        leetcode_tracker_comment_submission: isCommentsEnabled=false
      }=await chrome.storage.local.get("leetcode_tracker_comment_submission");
      
      await chrome.storage.local.set({"leetcode_tracker_comment_submission":!isCommentsEnabled});
      
      if(!isCommentsEnabled){
        await chrome.storage.local.set({
          "leetcode_tracker_code_submit":false,
          "leetcode_tracker_sync_multiple_submission":true
        });
      }
      
      this.initSettings();
    }
  /*{}----------Left for intilization of listeners*/
  initEventListeners(){
    this.setupLinks();
    DOM.authenticateButton.addEventListener(
      "click",
      this.handleAuthentication.bind(this)
    );
    DOM.hookButton.addEventListener("click", this.handleHookRepo.bind(this));
    DOM.unlinkButton.addEventListener("click", this.unlinkRepo.bind(this));
    DOM.logoutButton.addEventListener("click", this.logout.bind(this));
    DOM.changeAccountButton.addEventListener("click", this.logout.bind(this));
    DOM.checkboxCodeSubmitSetting.addEventListener(
      "click",
      this.toggleCodeSubmitSettings.bind(this)
    );
    DOM.checkboxSyncMultipleSubmissions.addEventListener(
      "click",
      this.toggleSyncMultipleSubmissionSetting.bind(this)
    );
    DOM.checkboxCommentSubmission.addEventListener(
      "click",
      this.toggleCommentSubmissionSetting.bind(this)
    );
    DOM.syncButton.addEventListener("click", this.startManualSync.bind(this));

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "statsUpdate") {
        this.updateStatsDisplay(message.data);
      }
    });
  }
  startManualSync(){
    console.log("[PopupManager.startManualSync] Sync button clicked!");
    DOM.syncButton.disabled=true;
    DOM.syncButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="spin" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg><span style="margin-left: 5px">Syncing...</span>';
    const style=document.createElement("style"); 
    style.textContent=`.spin { animation: spin 1.5s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } ;`
    document.head.appendChild(style);
    console.log("[PopupManager.startManualSync] Sending syncSolvedProblems message to background...");
    chrome.runtime.sendMessage({type:"syncSolvedProblems"});
    this.updateSyncStatus();
    
    // Poll for sync completion and refresh stats
    const syncCheckInterval = setInterval(async () => {
      const result = await chrome.storage.local.get("leetcode_tracker_sync_in_progress");
      if (!result.leetcode_tracker_sync_in_progress) {
        clearInterval(syncCheckInterval);
        console.log("Sync completed, refreshing stats...");
        this.updateSyncStatus();
        setTimeout(() => {
          this.initializeStats();
        }, 500);
      }
    }, 500);
  }
async updateSyncStatus(){
  try{
    const result=await chrome.storage.local.get(
      [
        "leetcode_tracker_sync_in_progress",
        "leetcode_tracker_last_sync_status",
        "leetcode_tracker_last_sync_date",
        "leetcode_tracker_last_sync_message"
      ]
    );
    const inProgress=result.leetcode_tracker_sync_in_progress||false;
    const lastStatus=result.leetcode_tracker_last_sync_status ||"";
    const lastDate=result.leetcode_tracker_last_sync_date?new Date(result.leetcode_tracker_last_sync_date):null;
    const lastMessage=result.leetcode_tracker_last_sync_message||"";
    if(inProgress){
      DOM.syncButton.disabled=true;
      DOM.syncButton.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="spin" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg><span style="margin-left: 5px">Syncing...</span>';
      DOM.syncStatus.textContent="Synchronization in progress...!!!"
      DOM.syncStatus.className="";
      DOM.syncStatus.style.color="rgb(0,214,0)";
    }
    else{
      DOM.syncButton.disabled=false;
      if(lastStatus=="success"){
        DOM.syncStatus.textContent="Last Sync : Successful!";
        DOM.syncStatus.className="text-success";
      }
      else{
        DOM.syncStatus.textContent="Last Sync : Failed!";
        DOM.syncStatus.className="text-danger";
      
      if(lastMessage){
        DOM.syncStatus.textContent=`Last Sync : -${lastMessage}`;
      }
      else{
        DOM.syncStatus.textContent="No Synchronization Performed Yet!";
        DOM.syncStatus.className="text-muted";
      }
      }
      if(lastDate){
        const formatedDate=this.formatDate(lastDate);
        DOM.syncTime.textContent=`${formatedDate}`;
        DOM.syncTime.className="text-muted";
      }
      else{
        DOM.syncTime.textContent=""
      }

    }
  }
  catch(error){
    console.log("Unexpected Error: ",error)
  }

}
/*cpy*/
  formatDate(date) {
  if (!date) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute(s) ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour(s) ago`;

  return date.toLocaleString();
}
setupLinks(){
  document.querySelectorAll("a.link").forEach(link=>{
    link.onclick=()=>chrome.tabs.create({active:true,url:link.href});
  });
}
async checkAuthStatus(){
  const result=await chrome.storage.local.get([
    "leetcode_tracker_token",
    "leetcode_tracker_username",
    "leetcode_tracker_repo",
    "leetcode_tracker_mode"
  ]);
  if(!result.leetcode_tracker_token||!result.leetcode_tracker_username){
    DOM.authenticate.style.display="block"
  }
  else if(!result.leetcode_tracker_repo||!result.leetcode_tracker_mode){
    DOM.hookgitRepo.style.display="block"
  }
  else{
    DOM.authenticated.style.display="block"
  }
  this.updateUserInfos();
}
async logout(){
  try{
  await chrome.storage.local.remove([
  "leetcode_tracker_token",
  "leetcode_tracker_username",
  "leetcode_tracker_repo",
  "leetcode_tracker_mode"
]);

  DOM.authenticate.style.display="block";
  DOM.hookgitRepo.style.display="none";
  DOM.authenticated.style.display="none";
}
catch(error){

}

}
async updateUserInfos(){
  const {leetcode_tracker_repo,leetcode_tracker_username}=
  await chrome.storage.local.get([
    "leetcode_tracker_repo",
    "leetcode_tracker_username"
  ]);
  if(leetcode_tracker_repo){
    DOM.repositoryName.textContent=leetcode_tracker_repo;
  }
  if (leetcode_tracker_username){
    DOM.githubUsername.textContent=leetcode_tracker_username
  }
  if(leetcode_tracker_repo && leetcode_tracker_username){
    DOM.repositoryLink.href=`https://github.com/${leetcode_tracker_username}/${leetcode_tracker_repo}`;
  }
}
async initializeStats(){
  try{
    this.startLoading();
    const initialStats=await this.getinitializeStats();
    if(initialStats){
      this.updateStatsDisplay(initialStats);
    }
  }
  catch(error){
    console.log("UnExpected Error!");
  }
}
getinitializeStats(){
  return new Promise((resolve)=>{
     chrome.runtime.sendMessage({type:"requestInitialStats"},
      (response)=>{
      resolve(response);
});
  })
}
updateStatsDisplay(stats){
  if(!stats) return;
  this.stopLoading();
  Object.keys(DOM.stats).forEach((key)=>{
    if(DOM.stats[key]){
      DOM.stats[key].textContent=stats[key]||0;
    }
  });
}
startLoading(){
  document.getElementById("loading-container").style.display="flex";
  document.getElementById("stats").classList.add("loading");
}
stopLoading(){
  document.getElementById("loading-container").style.display="none";
  document.getElementById("stats").classList.remove("loading");
}
async handleAuthentication() {
  try {
    const data = await chrome.runtime.sendMessage({ type: "getDataConfig" });

    if (!data) {
      console.error("No dataConfig received from background");
      return;
    }

    const url = `${data.URL}?client_id=${data.CLIENT_ID}&redirect_uri=${encodeURIComponent(data.REDIRECT_URL)}&scope=${data.SCOPES.join(" ")}`;
    console.log(url);
    chrome.tabs.create({ url, active: true });
  } catch (e) {
    console.error("Auth error:", e);
  }
}



async handleHookRepo(){
  const repositoryName=DOM.repoName.value;
  DOM.repoNameError.textContent="";
  if(!repositoryName){
    DOM.repoNameError.textContent="Please enter a valid Repository Name";
    return
  }
 else{
  try{
    const result=await chrome.storage.local.get([
      "leetcode_tracker_token",
      "leetcode_tracker_username"
    ]);
    if(result){
      await this.linkRepo(result,repositoryName);
    }
  }
  catch(e){
    DOM.repoNameError.textContent="Un Expected Error occured while linking Repository";
  }
 }
}
async linkRepo(githubAuthData,repositoryName){
  const {leetcode_tracker_token,leetcode_tracker_username}=githubAuthData;
  const dataConfig=await chrome.runtime.sendMessage({
    type:"getDataConfig"
  });
  try{
    const response= await fetch(
      `${dataConfig.REPOSITORY_URL}${leetcode_tracker_username}/${repositoryName}`,
      {
        method:"GET",
      headers:{
        ...dataConfig.HEADERS,
        Authorization: `token ${leetcode_tracker_token}`
      },
    }
    );
    const result=await response.json();
    if(!response.ok){
      if(response.status==401){
        this.logout();
      }
      throw new Error(result.message);
    }
    await chrome.storage.local.set({
      leetcode_tracker_mode:"commit",
      leetcode_tracker_repo:repositoryName
    });
    DOM.hookgitRepo.style.display="none";
    DOM.authenticated.style.display="block";
  }
  catch(error){
    DOM.repoNameError.textContent=error.message;
  }
}
async unlinkRepo(){
  try{
    await chrome.storage.local.remove([
      "leetcode_tracker_repo",
      "leetcode_tracker_mode"
    ]);
    DOM.authenticated.style.display="none";
    DOM.hookgitRepo.style.display="block";
  }
  catch (e){

  }
}

}
const popupManager=new PopupManager();
popupManager.checkAuthStatus();