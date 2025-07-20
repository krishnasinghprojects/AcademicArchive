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
      transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
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
      background: var(--folder-bg);
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 1001;
      display: none;
      max-width: 80vw;
      width:400px;
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      opacity: 0;
      transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      
      @media (max-width: 600px) {
        width: 95%;
        padding: 20px;
        max-width: 350px;
      }
      
      @media (max-width: 480px) {
        width: 98%;
        padding: 15px;
        max-width: 320px;
      }
    `;

    const hours = Math.floor(usageData.timeSpent / 3600);
    const minutes = Math.floor((usageData.timeSpent % 3600) / 60);

    dashboard.innerHTML = `
      <div class="dashboard-header" style="position: relative; margin-bottom: 20px;">
        <button id="closeDashboard" style="
          position: absolute;
          top: -10px;
          right: -10px;
          width: 30px;
          height: 30px;
          background: transparent;
          border: none;
          cursor: pointer;
          background-image: url('https://img.icons8.com/?size=100&id=vu5kHwGC4PNb&format=png&color=000000');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          filter: invert(var(--reverse));
        "></button>
        <h2 style="margin: 0; text-align: center;">Usage Dashboard</h2>
      </div>
      <div class="dashboard-content">
        <div class="stat-item" style="margin-bottom: 5px;">

          <span class="stat-value" style="font-size: 1em; display:flex; flex-direction:column;"><span style="color: var(--text-color);">Total Time Spent </span><span>${hours}h ${minutes}m</span></span>
        </div>
        <div class="api-status-bar">
          <div id="dashboardRateLimitDisplay">Loading...</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dashboard);

    function closeDashboard() {
      dashboard.style.opacity = '0';
      dashboard.style.transform = 'translate(-50%, -50%) scale(0.9)';
      backdrop.style.opacity = '0';
      setTimeout(() => {
        dashboard.style.display = 'none';
        backdrop.style.display = 'none';
      }, 150);
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
        <div style="
          background: var(--nav-bg);
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        ">
          <div style="font-size: 0.9em; color: var(--text-color);">
            API: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} (${percentage}%)
          </div>
          <div style="font-size: 0.8em; color: var(--folder-text-light); margin-top: 5px;">
            Resets: ${new Date(rateLimitInfo.reset).toLocaleTimeString()}
          </div>
        </div>
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
          }, 150);
        }
      };
    }
  }, 500);

  // Save data on page unload
  window.addEventListener('beforeunload', updateTimeSpent);
}

// Initialize all features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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