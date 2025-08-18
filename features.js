// ===============================
// ENHANCED FEATURES IMPLEMENTATION
// ===============================

// 1. GitHub API Rate Limit Tracking
function initializeRateLimitTracking() {
  async function fetchRateLimit() {
    try {
      const response = await fetch('https://api.github.com/rate_limit');
      const data = await response.json();

      const rateLimitInfo = {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
        used: data.rate.used
      };

      // Store in localStorage for dashboard
      localStorage.setItem('rateLimitInfo', JSON.stringify(rateLimitInfo));

      // Update UI if rate limit display exists
      updateRateLimitDisplay(rateLimitInfo);

      return rateLimitInfo;
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      return null;
    }
  }

  function updateRateLimitDisplay(rateLimitInfo) {
    const rateLimitElement = document.getElementById('rateLimitDisplay');
    if (rateLimitElement) {
      const resetTime = rateLimitInfo.reset.toLocaleTimeString();
      const percentage = Math.round((rateLimitInfo.remaining / rateLimitInfo.limit) * 100);

      rateLimitElement.innerHTML = `
        <div class="rate-limit-info" style="
          background: var(--nav-bg);
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          font-size: 0.85em;
          color: var(--text-color);
        ">
          <span>API: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} (${percentage}%)</span>
          <span style="margin-left: 10px; color: var(--folder-text-light);">Resets: ${resetTime}</span>
        </div>
      `;
    }
  }

  // Fetch rate limit on initialization
  fetchRateLimit();

  // Update every 5 minutes
  setInterval(fetchRateLimit, 5 * 60 * 1000);
}

// 2. Folder Size Tracking
function initializeFolderSizeTracking() {
  const folderSizes = JSON.parse(localStorage.getItem('folderSizes')) || {};

  function calculateFolderSize(folderElement) {
    const fileItems = folderElement.querySelectorAll('.file-item');
    let totalSize = 0;
    let fileCount = fileItems.length;

    // Estimate size based on file types (rough approximation in KB)
    fileItems.forEach(item => {
      const fileName = item.querySelector('.file-title')?.textContent || '';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      // Rough size estimates in KB
      const sizeEstimates = {
        'pdf': 1500,  // Increased for more realistic PDF sizes
        'jpg': 800, 'jpeg': 800, 'png': 600, 'gif': 400,
        'py': 15, 'js': 25, 'html': 30, 'css': 40,
        'c': 12, 'cpp': 18, 'java': 25, 'cs': 20,
        'ts': 30, 'go': 15, 'rb': 20, 'php': 25, 'swift': 22, 'rs': 18
      };

      totalSize += sizeEstimates[ext] || 20;
    });

    return { fileCount, totalSize };
  }

  function addFolderSizeDisplay(folderElement) {
    const folderPath = folderElement.dataset.folderPath;
    if (!folderPath) return;

    const { fileCount, totalSize } = calculateFolderSize(folderElement);

    // Store size info
    folderSizes[folderPath] = { fileCount, totalSize };
    localStorage.setItem('folderSizes', JSON.stringify(folderSizes));

    // Add size display to folder header
    const heading = folderElement.querySelector('h3, h4');
    if (heading && !heading.querySelector('.folder-size-info')) {
      const sizeInfo = document.createElement('span');
      sizeInfo.className = 'folder-size-info';
      sizeInfo.style.cssText = `
        font-size: 0.75em;
        color: var(--text-color);
        border-radius: 8px;
        font-weight: 300;
        margin-left: 10px;
        transition: all 0.15s ease;
        background: rgba(255, 255, 255, 0.9);
        padding: 4px 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 
                    0 1px 3px rgba(0, 0, 0, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
      `;
      // Convert KB to MB and format properly
      const sizeInMB = (totalSize / 1024).toFixed(1);
      sizeInfo.textContent = `${fileCount} Files - ${sizeInMB}MB`;
      heading.appendChild(sizeInfo);
    }
  }

  // Add size tracking to existing folders
  document.addEventListener('folderContentLoaded', () => {
    setTimeout(() => {
      const folders = document.querySelectorAll('.folder-node');
      folders.forEach(addFolderSizeDisplay);
    }, 500);
  });

  // Make sure the function is available globally
  window.addFolderSizeDisplay = addFolderSizeDisplay;
}

// 3. Enhanced Recent Files with Timestamps
function enhanceRecentFilesWithTimestamps() {
  function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Override the existing displayRecentFiles function
  window.displayRecentFilesEnhanced = function () {
    const recentFilesContainer = document.getElementById('recentFilesContainer');
    const recentFilesContainer2 = document.getElementById('recentFilesContainer2');

    if (!recentFilesContainer) return;

    [recentFilesContainer, recentFilesContainer2].forEach(container => {
      if (!container) return;
      container.innerHTML = '';

      try {
        const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];

        if (recentFiles.length === 0) {
          container.innerHTML = "No recent files to display.";
          return;
        }

        recentFiles.forEach(file => {
          const fileEntryDiv = document.createElement('li');
          fileEntryDiv.classList.add('file-item', 'recentFiles');

          const fileName = file.rawUrl.split('/').pop() || 'Unknown File';
          const viewedAt = new Date(file.viewedAt);
          const timeAgo = getTimeAgo(viewedAt);

          fileEntryDiv.innerHTML = `
            <div class="file-info">
              <span class="file-title">${fileName}</span>
              <span class="file-timestamp">Last accessed: ${timeAgo}</span>
            </div>
            <div class="file-buttons">
              <button class="view-button">View</button>
              <button class="download-button">${file.fileType === 'code' ? 'Copy' : 'Download'}</button>
            </div>
          `;

          const viewBtn = fileEntryDiv.querySelector('.view-button');
          const downloadBtn = fileEntryDiv.querySelector('.download-button');

          if (viewBtn) viewBtn.onclick = () => {
            if (window.handleFileView) {
              window.handleFileView(file.rawUrl, file.fileType);
            }
          };

          if (downloadBtn) downloadBtn.onclick = () => {
            if (window.handleFileDownload) {
              window.handleFileDownload(file.rawUrl, file.fileType);
            }
          };

          container.appendChild(fileEntryDiv);
        });
      } catch (e) {
        console.error("Error displaying recent files:", e);
        container.textContent = "Error loading recent files.";
      }
    });
  };

  // Replace the original function globally
  window.displayRecentFiles = window.displayRecentFilesEnhanced;

  // Also call it immediately to update the display
  setTimeout(() => {
    if (window.displayRecentFilesEnhanced) {
      window.displayRecentFilesEnhanced();
    }
  }, 1500);
}

// 4. Smooth CSS Transitions Enhancement
function enhanceCSSTransitions() {
  const style = document.createElement('style');
  style.id = 'enhanced-transitions';
  style.textContent = `
    /* Enhanced Fast Transitions */
    .folder-node {
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .folder-content {
      transition: max-height 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.15s ease,
                  transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .modal {
      transition: opacity 0.15s ease, backdrop-filter 0.15s ease !important;
    }
    
    .modal-content {
      transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.15s ease !important;
    }
    
    button {
      transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .file-item {
      transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .thumbnail {
      transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .thumbnail:hover {
      transform: scale(1.1) rotate(2deg) !important;
    }
    
    /* Dashboard specific styles with glassmorphic black/white theme */
    
    /* Mobile-first responsive design */
    @media (max-width: 768px) {
      #usageDashboard {
        width: 95vw !important;
        max-width: none !important;
        margin: 0 !important;
        border-radius: 20px !important;
      }
      
      .repo-display div {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 12px !important;
      }
      
      .repo-actions {
        width: 100% !important;
        justify-content: flex-end !important;
      }
    }
    
    @media (max-width: 480px) {
      #usageDashboard {
        width: 98vw !important;
        border-radius: 16px !important;
      }
      
      .repo-actions {
        flex-direction: column !important;
        width: 100% !important;
      }
      
      .repo-actions button {
        width: 100% !important;
      }
    }
    #usageDashboard {
      background: rgba(255, 255, 255, 0.05) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                  0 2px 16px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    }
    
    #usageDashboard input {
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) !important;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    #usageDashboard input:focus {
      outline: none !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), 
                  0 4px 12px rgba(0, 0, 0, 0.2) !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }
    
    #usageDashboard button {
      backdrop-filter: blur(10px) !important;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    #usageDashboard button:hover {
      transform: translateY(-2px) scale(1.02) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    #usageDashboard .repo-actions button:hover {
      transform: translateY(-2px) scale(1.08) !important;
      opacity: 1 !important;
    }
    
    #usageDashboard .edit-repo-btn:hover {
      filter: invert(0.9) !important;
    }
    
    #usageDashboard .delete-repo-btn:hover {
      filter: invert(0.8) !important;
    }
    
    #usageDashboard .save-repo-btn:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
    }
    
    #usageDashboard .cancel-edit-btn:hover {
      background: rgba(255, 255, 255, 0.06) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
    }
    
    #usageDashboard #addRepoBtn:hover {
      opacity: 1 !important;
      transform: translateY(-3px) scale(1.05) !important;
      filter: invert(0.9) !important;
      background: rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
      background-image: url('https://img.icons8.com/?size=100&id=60950&format=png&color=000000') !important;
      background-size: 22px 22px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }
    
    #usageDashboard #closeDashboard:hover {
      opacity: 1 !important;
      transform: scale(1.1) !important;
      filter: invert(0.9) !important;
   
    

    
    #usageDashboard .add-repo-form {
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      backdrop-filter: blur(15px) !important;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    #usageDashboard .add-repo-form:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
      transform: translateY(-1px) !important;
    }
    
    #usageDashboard .repo-list > div {
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      backdrop-filter: blur(10px) !important;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    #usageDashboard .repo-list > div:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    }
    

    
    /* Folder container refresh animation */
    #folderContainer {
      transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                  transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    /* Enhanced glassmorphic effects for all elements */
    .folder-node {
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    .folder-node:hover {
      backdrop-filter: blur(12px) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
    }
  `;

  // Remove existing style if it exists
  const existingStyle = document.getElementById('enhanced-transitions');
  if (existingStyle) {
    existingStyle.remove();
  }

  document.head.appendChild(style);
}

// 5. Sound Features (Removed Stopwatch)
function initializeSoundFeatures() {
  // Sound generation using Web Audio API for notifications
  function createSound(frequency, duration, type = 'sine') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error creating sound:', error);
    }
  }

  // Export sound function for use in other parts of the app
  window.playNotificationSound = () => {
    createSound(440, 0.2); // A4 note
    setTimeout(() => createSound(554.37, 0.2), 200); // C#5 note
  };
}

// 6. Usage Dashboard
function initializeUsageDashboard() {
  const usageData = JSON.parse(localStorage.getItem('usageData')) || {
    timeSpent: 0,
    filesAccessed: 0,
    favoritesCount: 0,
    studyStreaks: 0,
    lastVisit: new Date().toISOString(),
    dailyStats: {}
  };

  // Track time spent
  let sessionStartTime = Date.now();
  let isActive = true;

  function updateTimeSpent() {
    if (isActive) {
      const currentTime = Date.now();
      const sessionTime = Math.floor((currentTime - sessionStartTime) / 1000);
      usageData.timeSpent += sessionTime;
      sessionStartTime = currentTime;
      localStorage.setItem('usageData', JSON.stringify(usageData));
    }
  }

  // Track activity
  document.addEventListener('visibilitychange', () => {
    isActive = !document.hidden;
    if (isActive) {
      sessionStartTime = Date.now();
    } else {
      updateTimeSpent();
    }
  });

  // Update time every 30 seconds
  setInterval(updateTimeSpent, 30000);

  // Removed file tracking functionality as requested

  // Create dashboard UI
  function createUsageDashboard() {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'dashboardBackdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: none;
      opacity: 0;
      transition: opacity 0.15s ease;
    `;

    const dashboard = document.createElement('div');
    dashboard.id = 'usageDashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(0, 0, 0, 0.85);
      padding: 0;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 
                  0 8px 32px rgba(0, 0, 0, 0.6);
      z-index: 1001;
      display: none;
      width: min(90vw, 800px);
      max-height: 90vh;
      overflow: hidden;
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    const hours = Math.floor(usageData.timeSpent / 3600);
    const minutes = Math.floor((usageData.timeSpent % 3600) / 60);

    dashboard.innerHTML = `
      <div style="
        padding: clamp(20px, 4vw, 30px); 
        max-height: 90vh; 
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      ">
        <div class="dashboard-header" style="position: relative; margin-bottom: clamp(20px, 4vw, 30px);">
          <button id="closeDashboard" style="
            position: absolute;
            top: -15px;
            right: -15px;
            width: clamp(28px, 5vw, 32px);
            height: clamp(28px, 5vw, 32px);
            background: transparent;
            border:none;
            border-radius:10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            z-index: 10;
            background-image: url('https://img.icons8.com/?size=100&id=vu5kHwGC4PNb&format=png&color=000000');
            background-size: clamp(20px, 4vw, 24px) clamp(20px, 4vw, 24px);
            background-repeat: no-repeat;
            background-position: center;
            filter: invert(0.8);
            opacity: 0.8;
          " title="Close Dashboard"></button>
          <h2 style="
            margin: 0; text-align: center; 
            color: rgba(255, 255, 255, 0.9); 
            font-size: clamp(20px, 4vw, 24px); 
            font-weight: 600;
          ">Dashboard</h2>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: clamp(16px, 3vw, 20px);">
          <!-- Stats Cards -->
          <div style="
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: clamp(16px, 3vw, 20px);
          ">
            <div style="
              padding: clamp(16px, 3vw, 24px); 
              background: rgba(255, 255, 255, 0.03); 
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px; backdrop-filter: blur(20px);
              transition: all 0.3s ease;
            ">
              <div style="
                color: rgba(255, 255, 255, 0.7); 
                font-size: clamp(14px, 2.5vw, 16px); 
                margin-bottom: 8px;
              ">Total Time Spent</div>
              <div style="
                color: rgba(255, 255, 255, 0.9); 
                font-size: clamp(24px, 5vw, 28px); 
                font-weight: 600;
              ">${hours}h ${minutes}m</div>
            </div>
            
            <div style="
              padding: clamp(16px, 3vw, 24px); 
              background: rgba(255, 255, 255, 0.03); 
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px; backdrop-filter: blur(20px);
              transition: all 0.3s ease;
            ">
              <div id="dashboardRateLimitDisplay">Loading...</div>
            </div>
          </div>
          
          <!-- Repository Management -->
          <div style="
            padding: clamp(16px, 3vw, 24px); 
            background: rgba(255, 255, 255, 0.03); 
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px; backdrop-filter: blur(20px);
            transition: all 0.3s ease;
            margin-bottom: 50px;
          ">
            <h3 style="
              margin: 0 0 clamp(16px, 3vw, 20px) 0; 
              color: rgba(255, 255, 255, 0.9); 
              font-size: clamp(16px, 3vw, 18px); 
              font-weight: 600;
            ">Repository Management</h3>
            
            <!-- Input Section -->
            <div style="
              margin-bottom: clamp(12px, 2.5vw, 16px); 
              padding: clamp(16px, 3vw, 20px); 
              background: rgba(255, 255, 255, 0.02); 
              border: 1px solid rgba(255, 255, 255, 0.06);
              border-radius: 12px; backdrop-filter: blur(15px);
              transition: all 0.1s ease;
            ">
              <div style="
                display: flex; 
                flex-direction: column;
                gap: 12px;
              ">
                <input type="text" id="newRepoOwner" placeholder="Owner (username)" style="
                  padding: 12px; border: 1px solid rgba(255, 255, 255, 0.08); 
                  border-radius: 8px; background: rgba(255, 255, 255, 0.03); 
                  color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); 
                  font-size: 14px; outline: none; width: 100%; box-sizing: border-box;
                  transition: all 0.1s ease;
                " onkeydown="if(event.key === 'Enter') { event.preventDefault(); document.getElementById('newRepoName').focus(); }">
                <input type="text" id="newRepoName" placeholder="Repository name" style="
                  padding: 12px; border: 1px solid rgba(255, 255, 255, 0.08); 
                  border-radius: 8px; background: rgba(255, 255, 255, 0.03); 
                  color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); 
                  font-size: 14px; outline: none; width: 100%; box-sizing: border-box;
                  transition: all 0.1s ease;
                " onkeydown="if(event.key === 'Enter') { event.preventDefault(); document.getElementById('addRepoBtn').click(); }">
              </div>
            </div>
            
            <!-- Add Button Section -->
            <div style="
              margin-bottom: clamp(16px, 3vw, 20px);
              display: flex;
              justify-content: center;
            ">
              <button id="addRepoBtn" style="
                width: 48px; height: 48px; 
                background: rgba(255, 255, 255, 0.05); 
                border: 1px solid rgba(255, 255, 255, 0.1); 
                border-radius: 12px; cursor: pointer; 
                transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex; align-items: center; justify-content: center;
                background-image: url('https://img.icons8.com/?size=100&id=60950&format=png&color=000000');
                background-size: 22px 22px;
                background-repeat: no-repeat;
                background-position: center;
                filter: invert(0.8);
                opacity: 0.8;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              " title="Add Repository"></button>
            </div>
            
            <div style="
              overflow-y: auto;
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            ">
              <div id="repositoryList"></div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        @media (min-width: 600px) {
          .dashboard-content .add-repo-form > div {
            flex-direction: row !important;
          }
        }
        
        /* Custom scrollbar for webkit browsers */
        #usageDashboard::-webkit-scrollbar,
        #repositoryList::-webkit-scrollbar {
          width: 6px;
        }
        
        #usageDashboard::-webkit-scrollbar-track,
        #repositoryList::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        #usageDashboard::-webkit-scrollbar-thumb,
        #repositoryList::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        #usageDashboard::-webkit-scrollbar-thumb:hover,
        #repositoryList::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dashboard);

    // Repository management functionality
    let currentRepoConfigs = [];
    let fullDataConfig = {};
    let repositoriesChanged = false;

    async function loadRepositoryConfigs() {
      try {
        // First check localStorage for stored data
        const storedData = localStorage.getItem('fullDataConfig');
        if (storedData) {
          fullDataConfig = JSON.parse(storedData);
          currentRepoConfigs = fullDataConfig.repoConfigs || [];
        } else {
          // Fallback to data.json
          const response = await fetch('data.json');
          const data = await response.json();
          fullDataConfig = data;
          currentRepoConfigs = data.repoConfigs || [];
          // Store in localStorage for future use
          localStorage.setItem('fullDataConfig', JSON.stringify(fullDataConfig));
        }
        renderRepositoryList();
      } catch (error) {
        console.error('Error loading repository configs:', error);
        currentRepoConfigs = [];
        fullDataConfig = { repoConfigs: [] };
        renderRepositoryList();
      }
    }

    function renderRepositoryList() {
      const repositoryList = document.getElementById('repositoryList');
      if (!repositoryList) return;

      repositoryList.innerHTML = '';

      if (currentRepoConfigs.length === 0) {
        repositoryList.innerHTML = '<p style="color: var(--folder-text-light); text-align: center; padding: 20px;">No repositories configured</p>';
        return;
      }

      currentRepoConfigs.forEach((repo, index) => {
        const repoItem = document.createElement('div');
        repoItem.style.cssText = `
          padding: clamp(12px, 2.5vw, 15px); 
          margin-bottom: clamp(8px, 2vw, 12px); 
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: 10px; backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;

        repoItem.innerHTML = `
          <div class="repo-display-${index}" style="
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            opacity: 1;
            transform: translateY(0);
            transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          ">
            <div class="repo-info" style="flex: 1; min-width: 200px;">
              <div style="
                font-weight: 500; 
                color: rgba(255, 255, 255, 0.9);
                font-size: clamp(14px, 2.5vw, 16px);
                margin-bottom: 4px;
              ">${repo.owner}/${repo.name}</div>
              <div style="
                font-size: clamp(12px, 2vw, 13px); 
                color: rgba(255, 255, 255, 0.6);
              ">Owner: ${repo.owner}</div>
            </div>
            <div class="repo-actions" style="
              display: flex; 
              gap: clamp(6px, 1.5vw, 8px);
              flex-shrink: 0;
            ">
              <button class="edit-repo-btn" data-index="${index}" style="
                width: 32px; height: 32px; 
                border: none; 
                border-radius: 6px; cursor: pointer; 
                transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex; align-items: center; justify-content: center;
                background-image: url('https://img.icons8.com/?size=100&id=q1GDa2sV0lVB&format=png&color=000000');
                background-size: 18px 18px;
                background-repeat: no-repeat;
                background-position: center;
                filter: invert(0.8);
                opacity: 0.8;
              " title="Edit Repository"></button>
              <button class="delete-repo-btn" data-index="${index}" style="
                width: 32px; height: 32px;
                border: solid 1px var(--boder-color); 
                border-radius: 6px; cursor: pointer; 
                transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex; align-items: center; justify-content: center;
                background-image: url('https://img.icons8.com/?size=100&id=99971&format=png&color=000000');
                background-size: 18px 18px;
                background-repeat: no-repeat;
                background-position: center;
                filter: invert(0.7);
                opacity: 0.7;
              " title="Delete Repository"></button>
            </div>
          </div>
          
          <div class="repo-edit-${index}" style="
            display: none;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          ">
            <div style="
              display: flex; 
              flex-direction: column;
              gap: 12px; 
              margin-bottom: 12px;
            ">
              <input type="text" class="edit-owner-${index}" value="${repo.owner}" placeholder="Owner" style="
                padding: clamp(8px, 2vw, 10px); 
                border: 1px solid rgba(255, 255, 255, 0.1); 
                border-radius: 6px; 
                background: rgba(255, 255, 255, 0.05); 
                color: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px); 
                font-size: clamp(12px, 2.5vw, 13px);
                outline: none;
                transition: all 0.3s ease;
                width: 100%;
                box-sizing: border-box;
              ">
              <input type="text" class="edit-name-${index}" value="${repo.name}" placeholder="Repository name" style="
                padding: clamp(8px, 2vw, 10px); 
                border: 1px solid rgba(255, 255, 255, 0.1); 
                border-radius: 6px; 
                background: rgba(255, 255, 255, 0.05); 
                color: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px); 
                font-size: clamp(12px, 2.5vw, 13px);
                outline: none;
                transition: all 0.3s ease;
                width: 100%;
                box-sizing: border-box;
              ">
            </div>
            <div style="display: flex; gap: clamp(8px, 2vw, 12px); justify-content: flex-end;">
              <button class="save-repo-btn" data-index="${index}" style="
                padding: clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px); 
                background: rgba(255, 255, 255, 0.08); 
                color: rgba(255, 255, 255, 0.9); 
                border: 1px solid rgba(255, 255, 255, 0.12); 
                border-radius: 8px; cursor: pointer;
                font-size: clamp(12px, 2.5vw, 14px); font-weight: 500; 
                backdrop-filter: blur(10px);
                transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                min-width: 60px;
              ">Save</button>
              <button class="cancel-edit-btn" data-index="${index}" style="
                padding: clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px); 
                background: rgba(255, 255, 255, 0.03); 
                color: rgba(255, 255, 255, 0.7); 
                border: 1px solid rgba(255, 255, 255, 0.06); 
                border-radius: 8px; cursor: pointer;
                font-size: clamp(12px, 2.5vw, 14px); font-weight: 500; 
                backdrop-filter: blur(10px);
                transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                min-width: 60px;
              ">Cancel</button>
            </div>
          </div>
        `;

        repositoryList.appendChild(repoItem);
      });

      // Add event listeners
      repositoryList.querySelectorAll('.edit-repo-btn').forEach(btn => {
        btn.onclick = () => toggleEditMode(parseInt(btn.dataset.index), true);
      });

      repositoryList.querySelectorAll('.delete-repo-btn').forEach(btn => {
        btn.onclick = () => deleteRepository(parseInt(btn.dataset.index));
      });

      repositoryList.querySelectorAll('.save-repo-btn').forEach(btn => {
        btn.onclick = () => saveRepositoryEdit(parseInt(btn.dataset.index));
      });

      repositoryList.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.onclick = () => toggleEditMode(parseInt(btn.dataset.index), false);
      });
    }

    function addRepository() {
      const ownerInput = document.getElementById('newRepoOwner');
      const nameInput = document.getElementById('newRepoName');

      const owner = ownerInput.value.trim();
      const name = nameInput.value.trim();

      if (!owner || !name) {
        showNotification('Please enter both owner and repository name', 'error');
        return;
      }

      // Check for duplicates
      const exists = currentRepoConfigs.some(repo =>
        repo.owner === owner && repo.name === name
      );

      if (exists) {
        showNotification('This repository is already in the list', 'error');
        return;
      }

      currentRepoConfigs.push({ owner, name });
      repositoriesChanged = true;
      saveRepositoryConfigs();
      renderRepositoryList();

      // Clear inputs
      ownerInput.value = '';
      nameInput.value = '';
    }

    function toggleEditMode(index, isEditing) {
      const displayDiv = document.querySelector(`.repo-display-${index}`);
      const editDiv = document.querySelector(`.repo-edit-${index}`);

      if (displayDiv && editDiv) {
        if (isEditing) {
          // Hide display, show edit
          displayDiv.style.opacity = '0';
          displayDiv.style.transform = 'translateY(-10px)';

          setTimeout(() => {
            displayDiv.style.display = 'none';
            editDiv.style.display = 'block';

            // Trigger reflow
            editDiv.offsetHeight;

            editDiv.style.opacity = '1';
            editDiv.style.transform = 'translateY(0)';
          }, 100);
        } else {
          // Hide edit, show display
          editDiv.style.opacity = '0';
          editDiv.style.transform = 'translateY(-10px)';

          setTimeout(() => {
            editDiv.style.display = 'none';
            displayDiv.style.display = 'flex';

            // Trigger reflow
            displayDiv.offsetHeight;

            displayDiv.style.opacity = '1';
            displayDiv.style.transform = 'translateY(0)';
          }, 100);
        }
      }
    }

    function saveRepositoryEdit(index) {
      const ownerInput = document.querySelector(`.edit-owner-${index}`);
      const nameInput = document.querySelector(`.edit-name-${index}`);

      if (!ownerInput || !nameInput) return;

      const newOwner = ownerInput.value.trim();
      const newName = nameInput.value.trim();

      if (!newOwner || !newName) {
        showNotification('Owner and repository name cannot be empty', 'error');
        return;
      }

      // Check for duplicates (excluding current item)
      const exists = currentRepoConfigs.some((r, i) =>
        i !== index && r.owner === newOwner && r.name === newName
      );

      if (exists) {
        showNotification('This repository is already in the list', 'error');
        return;
      }

      currentRepoConfigs[index] = { owner: newOwner, name: newName };
      repositoriesChanged = true;
      saveRepositoryConfigs();
      renderRepositoryList();
    }

    function deleteRepository(index) {
      const repo = currentRepoConfigs[index];
      if (!repo) return;

      // Create custom confirmation dialog
      const confirmDialog = document.createElement('div');
      confirmDialog.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 2001; display: flex;
        align-items: center; justify-content: center;
      `;

      confirmDialog.innerHTML = `
        <div style="
          background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(30px);
          padding: clamp(20px, 4vw, 30px); border-radius: 16px; 
          max-width: min(90vw, 450px); width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        ">
          <h3 style="
            margin: 0 0 clamp(16px, 3vw, 20px) 0; 
            color: rgba(255, 255, 255, 0.9); 
            font-size: clamp(16px, 3vw, 18px); 
            font-weight: 600;
          ">Confirm Delete</h3>
          <p style="
            margin: 0 0 clamp(20px, 4vw, 25px) 0; 
            color: rgba(255, 255, 255, 0.8); 
            font-size: clamp(13px, 2.5vw, 14px); 
            line-height: 1.5;
          ">
            Are you sure you want to remove <strong style="color: rgba(255, 255, 255, 0.95);">${repo.owner}/${repo.name}</strong>?
            <br><span style="color: rgba(255, 255, 255, 0.6); font-size: clamp(12px, 2vw, 13px);">This action cannot be undone.</span>
          </p>
          <div style="
            display: flex; 
            gap: clamp(8px, 2vw, 12px); 
            justify-content: flex-end;
            flex-wrap: wrap;
          ">
            <button id="cancelDelete" style="
              padding: clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px); 
              background: rgba(255, 255, 255, 0.08); 
              color: rgba(255, 255, 255, 0.9); 
              border: 1px solid rgba(255, 255, 255, 0.12); 
              border-radius: 8px; cursor: pointer;
              font-size: clamp(12px, 2.5vw, 14px); font-weight: 500; 
              backdrop-filter: blur(10px);
              transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              min-width: 80px;
            ">Cancel</button>
            <button id="confirmDelete" style="
              padding: clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px); 
              background: rgba(255, 255, 255, 0.03); 
              color: rgba(255, 255, 255, 0.7); 
              border: 1px solid rgba(255, 255, 255, 0.06); 
              border-radius: 8px; cursor: pointer;
              font-size: clamp(12px, 2.5vw, 14px); font-weight: 500; 
              backdrop-filter: blur(10px);
              transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              min-width: 80px;
            ">Delete</button>
          </div>
        </div>
      `;

      document.body.appendChild(confirmDialog);

      // Animate in
      setTimeout(() => {
        const dialogContent = confirmDialog.querySelector('div');
        dialogContent.style.opacity = '1';
        dialogContent.style.transform = 'scale(1)';
      }, 50);

      function closeDialog() {
        const dialogContent = confirmDialog.querySelector('div');
        dialogContent.style.opacity = '0';
        dialogContent.style.transform = 'scale(0.9)';
        setTimeout(() => {
          confirmDialog.remove();
        }, 200);
      }

      document.getElementById('cancelDelete').onclick = closeDialog;

      document.getElementById('confirmDelete').onclick = () => {
        currentRepoConfigs.splice(index, 1);
        repositoriesChanged = true;
        saveRepositoryConfigs();
        renderRepositoryList();
        closeDialog();
      };

      // Close on backdrop click
      confirmDialog.onclick = (e) => {
        if (e.target === confirmDialog) {
          closeDialog();
        }
      };
    }

    async function saveRepositoryConfigs() {
      try {
        // Update the full data config
        fullDataConfig.repoConfigs = currentRepoConfigs;

        // Store the entire configuration in localStorage
        localStorage.setItem('fullDataConfig', JSON.stringify(fullDataConfig));
        localStorage.setItem('repositoryConfigs', JSON.stringify(currentRepoConfigs));

        // Show success message - refresh will happen when dashboard closes
        refreshFoldersRealTime();

      } catch (error) {
        console.error('Error saving repository configs:', error);
        showNotification('Error saving repository configuration', 'error');
      }
    }

    // Real-time folder refresh function
    function refreshFoldersRealTime() {
      // Only show notification if changes were made
      if (repositoriesChanged) {
        showNotification('Repository configuration updated successfully', 'info');
      }
    }

    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');

      // Glassmorphic notification design - monochrome theme
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 2000;
        padding: 16px 20px; border-radius: 16px; 
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.05); 
        backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 0; transform: translateX(100%) scale(0.9);
        font-weight: 500; font-size: 14px;
        max-width: 320px; min-width: 200px;
      `;

      notification.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span>${message}</span>
        </div>
      `;

      // Add pulse animation
      const pulseStyle = document.createElement('style');
      pulseStyle.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `;
      document.head.appendChild(pulseStyle);

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) scale(1)';
      }, 100);

      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) scale(0.9)';
        setTimeout(() => {
          notification.remove();
          pulseStyle.remove();
        }, 200);
      }, 3000);
    }



    // Initialize repository management
    loadRepositoryConfigs();

    // Add event listener for add repository button
    const addRepoBtn = document.getElementById('addRepoBtn');
    if (addRepoBtn) {
      addRepoBtn.onclick = addRepository;
    }



    // Add enter key support for inputs
    const ownerInput = document.getElementById('newRepoOwner');
    const nameInput = document.getElementById('newRepoName');

    if (ownerInput && nameInput) {
      [ownerInput, nameInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addRepository();
          }
        });
      });
    }

    function closeDashboard() {
      dashboard.style.opacity = '0';
      dashboard.style.transform = 'translate(-50%, -50%) scale(0.95)';
      backdrop.style.opacity = '0';

      setTimeout(() => {
        dashboard.style.display = 'none';
        backdrop.style.display = 'none';

        // Only refresh if repositories were actually changed
        if (repositoriesChanged) {
          // Smooth refresh with blackout transition
          refreshFoldersWithTransition();
        }
      }, 200);
    }

    function refreshFoldersWithTransition() {
      // Store a flag in sessionStorage to show blackout on reload
      sessionStorage.setItem('showReloadBlackout', 'true');

      // Store current theme to ensure consistency
      const currentTheme = document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      sessionStorage.setItem('reloadTheme', currentTheme);

      // Create a persistent blackout overlay
      const blackoutOverlay = document.createElement('div');
      blackoutOverlay.id = 'reloadBlackout';
      // Detect theme more reliably
      let isDarkTheme = false;

      // Check data-theme attribute first
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr === 'dark') {
        isDarkTheme = true;
      } else if (themeAttr === 'light') {
        isDarkTheme = false;
      } else {
        // Fallback to system preference
        isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      const backgroundColor = isDarkTheme ? '#000' : '#fff';

      blackoutOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${backgroundColor};
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;

      // Hide scrollbars during blackout
      document.body.style.overflow = 'hidden';

      document.body.appendChild(blackoutOverlay);

      // Fade in the blackout
      setTimeout(() => {
        blackoutOverlay.style.opacity = '1';
      }, 50);

      // Reload after blackout is complete
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }

    const closeBtn = document.getElementById('closeDashboard');
    if (closeBtn) {
      closeBtn.onclick = closeDashboard;
    }

    // Click outside to close
    backdrop.onclick = closeDashboard;

    // Update rate limit in dashboard
    const rateLimitInfo = JSON.parse(localStorage.getItem('rateLimitInfo') || '{}');
    const dashboardRateLimit = document.getElementById('dashboardRateLimitDisplay');
    if (dashboardRateLimit && rateLimitInfo.limit) {
      const percentage = Math.round((rateLimitInfo.remaining / rateLimitInfo.limit) * 100);
      dashboardRateLimit.innerHTML = `
        <div style="color: rgba(255, 255, 255, 0.7); font-size: 16px; margin-bottom: 8px;">API: ${percentage}% (${rateLimitInfo.remaining}/${rateLimitInfo.limit})</div>
        <div style="color: rgba(255, 255, 255, 0.9); font-size: 28px; font-weight: 600;">${percentage}%</div>
        <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-top: 8px;">
          Resets: ${new Date(rateLimitInfo.reset).toLocaleTimeString()}
        </div>
      `;
    } else {
      dashboardRateLimit.innerHTML = `
        <div style="color: rgba(255, 255, 255, 0.7); font-size: 16px; margin-bottom: 8px;">API Status</div>
        <div style="color: rgba(255, 255, 255, 0.9); font-size: 28px; font-weight: 600;">Loading...</div>
      `;
    }

    return { dashboard, backdrop };
  }

  // Removed calculateStudyStreak function as it's no longer needed

  // Connect to navbar button instead of creating floating button
  setTimeout(() => {
    const navbarDashboardBtn = document.getElementById('usageDashboardBtn');
    if (navbarDashboardBtn) {
      navbarDashboardBtn.onclick = () => {
        let dashboard = document.getElementById('usageDashboard');
        let backdrop = document.getElementById('dashboardBackdrop');

        if (!dashboard) {
          const result = createUsageDashboard();
          dashboard = result.dashboard;
          backdrop = result.backdrop;
        }

        if (dashboard.style.display === 'none' || dashboard.style.display === '') {
          // Show dashboard with fade in animation
          backdrop.style.display = 'block';
          dashboard.style.display = 'block';
          // Force reflow
          dashboard.offsetHeight;
          backdrop.style.opacity = '1';
          dashboard.style.opacity = '1';
          dashboard.style.transform = 'translate(-50%, -50%) scale(1)';
        } else {
          // Hide dashboard with fade out animation
          dashboard.style.opacity = '0';
          dashboard.style.transform = 'translate(-50%, -50%) scale(0.9)';
          backdrop.style.opacity = '0';
          setTimeout(() => {
            dashboard.style.display = 'none';
            backdrop.style.display = 'none';
          }, 200);
        }
      };
    }
  }, 500);

  // Save data on page unload
  window.addEventListener('beforeunload', updateTimeSpent);
}

// Handle reload blackout on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if we need to handle the reload blackout
  if (sessionStorage.getItem('showReloadBlackout') === 'true') {
    // Remove the flags
    sessionStorage.removeItem('showReloadBlackout');
    sessionStorage.removeItem('reloadTheme');

    // Function to completely clean up blackout
    function cleanupBlackout() {
      // Find and remove the immediate blackout element
      const immediateBlackout = document.getElementById('immediateBlackout');
      if (immediateBlackout) {
        immediateBlackout.remove();
      }

      // Detect current theme for proper restoration
      let isDarkTheme = false;
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr === 'dark') {
        isDarkTheme = true;
      } else if (themeAttr === 'light') {
        isDarkTheme = false;
      } else {
        isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      // Restore document and body styles with proper theme background
      document.documentElement.removeAttribute('style');
      document.body.removeAttribute('style');

      // Ensure background matches theme during restoration
      const properBackground = isDarkTheme ? '#000' : '#fff';
      document.body.style.background = '';
      document.documentElement.style.background = '';

      // Remove any blackout-related styles
      const blackoutStyles = document.querySelectorAll('style');
      blackoutStyles.forEach(style => {
        if (style.textContent.includes('visibility: hidden') ||
          style.textContent.includes('background: #000') ||
          style.textContent.includes('@keyframes spin')) {
          style.remove();
        }
      });

      // Show all hidden content
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style.visibility === 'hidden') {
          el.style.visibility = '';
        }
      });

      // Force refresh of styles
      document.body.offsetHeight;
    }

    // Wait for page to be fully loaded, then fade out blackout
    window.addEventListener('load', () => {
      setTimeout(() => {
        const immediateBlackout = document.getElementById('immediateBlackout');
        if (immediateBlackout) {
          immediateBlackout.style.transition = 'opacity 0.5s ease';
          immediateBlackout.style.opacity = '0';
          setTimeout(() => {
            cleanupBlackout();
          }, 500);
        } else {
          // If blackout element not found, clean up anyway
          cleanupBlackout();
        }
      }, 800); // Give folders time to render
    });
  }

  // Fallback cleanup - remove any stuck blackout elements
  setTimeout(() => {
    const stuckBlackout = document.getElementById('immediateBlackout');
    if (stuckBlackout) {
      stuckBlackout.remove();
      document.documentElement.removeAttribute('style');
      document.body.removeAttribute('style');
    }
  }, 2000);

  // Initialize all features
  setTimeout(() => {
    initializeRateLimitTracking();
    initializeFolderSizeTracking();
    enhanceRecentFilesWithTimestamps();
    enhanceCSSTransitions();
    initializeSoundFeatures();
    initializeUsageDashboard();
  }, 1000);
});

// Export functions for global access
window.initializeRateLimitTracking = initializeRateLimitTracking;
window.initializeFolderSizeTracking = initializeFolderSizeTracking;
window.enhanceRecentFilesWithTimestamps = enhanceRecentFilesWithTimestamps;
window.enhanceCSSTransitions = enhanceCSSTransitions;
window.initializeSoundFeatures = initializeSoundFeatures;
window.initializeUsageDashboard = initializeUsageDashboard;