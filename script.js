document.addEventListener('DOMContentLoaded', () => {

  fetch('data.json')
    .then(response => response.json())
    .then(data => {

      const repoConfigs = data.repoConfigs;

      // Initialize essential features only - optimized for performance
      setTimeout(() => {
        if (typeof initializeUsageDashboard === 'function') initializeUsageDashboard();
        if (typeof initializeRateLimitTracking === 'function') initializeRateLimitTracking();
        if (typeof initializeFolderSizeTracking === 'function') initializeFolderSizeTracking();
        if (typeof enhanceRecentFilesWithTimestamps === 'function') enhanceRecentFilesWithTimestamps();
        if (typeof enhanceCSSTransitions === 'function') enhanceCSSTransitions();
      }, 100);
      // Modal elements
      const pdfModal = document.getElementById('pdfModal');
      const closeModal = document.getElementById('closeModal');
      const pdfViewer = document.getElementById('pdfViewer');
      const imageModal = document.getElementById('imageModal');
      const closeImageModal = document.getElementById('closeImageModal');
      const imageViewer = document.getElementById('imageViewer');
      const prevImageBtn = document.getElementById('prevImage');
      const nextImageBtn = document.getElementById('nextImage');
      const codeModal = document.getElementById('codeModal');
      const closeCodeModal = document.getElementById('closeCodeModal');
      const codeViewer = document.getElementById('codeViewer');

      // State variables
      let currentImageIndex = 0;
      let currentImageList = [];
      let currentPdfShareUrl = "";
      let currentCodeShareUrl = "";
      let currentImageShareUrl = "";
      let notificationCooldown = false;
      let pinnedFolders = JSON.parse(localStorage.getItem('pinnedFolders')) || [];
      let allFileElements = [];

      let searchActive = false;

      document.getElementById('searchButton').addEventListener('click', function (e) {
        const input = document.getElementById('searchInput');

        if (!searchActive) {
          // Activate search
          input.classList.add('active');
          input.focus();
          searchActive = true;
        } else {
          // Perform search only when active
          if (input.value.trim()) {
            performSearch();
          }
          input.classList.remove('active');
          searchActive = false;
        }
      });

      function displayRecentFiles() {
        const recentFilesContainer = document.getElementById('recentFilesContainer');
        const recentFilesContainer2 = document.getElementById('recentFilesContainer2');
        if (!recentFilesContainer) {
          console.error("Error: 'recentFilesContainer' element not found.");
          return;
        }

        // Clear any existing content in the container
        recentFilesContainer.innerHTML = '';

        try {
          const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];

          if (recentFiles.length === 0) {
            recentFilesContainer.textContent = "No recent files to display.";
            recentFilesContainer2.innerHTML = "No recent files to display.";
            return;
          }

          recentFiles.forEach(file => {
            const fileEntryDiv = document.createElement('li');
            fileEntryDiv.classList.add('file-item');
            fileEntryDiv.classList.add('recentFiles');

            // Extract a simple file name from the rawUrl
            const fileName = file.rawUrl.split('/').pop() || 'Unknown File';
            
            // Calculate time ago
            const viewedAt = new Date(file.viewedAt);
            const now = new Date();
            const diffMs = now - viewedAt;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let timeAgo;
            if (diffMins < 1) timeAgo = 'Just now';
            else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
            else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
            else timeAgo = `${diffDays}d ago`;

            // Create file info container
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'file-title';
            fileNameSpan.textContent = fileName;
            fileInfo.appendChild(fileNameSpan);
            
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'file-timestamp';
            timestampSpan.textContent = `Last accessed: ${timeAgo}`;
            fileInfo.appendChild(timestampSpan);
            
            fileEntryDiv.appendChild(fileInfo);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'file-buttons';
            fileEntryDiv.appendChild(buttonContainer);

            // View Button
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.className = 'view-button';
            viewButton.onclick = () => handleFileView(file.rawUrl, file.fileType);
            buttonContainer.appendChild(viewButton);

            // Download Button
            const downloadButton = document.createElement('button');
            downloadButton.textContent = file.fileType === 'code' ? 'Copy' : 'Download';
            downloadButton.className = 'download-button';
            downloadButton.onclick = () => handleFileDownload(file.rawUrl, file.fileType);
            buttonContainer.appendChild(downloadButton);

            recentFilesContainer.appendChild(fileEntryDiv);
          });


          // Clear any existing content in the container
          recentFilesContainer2.innerHTML = '';

          recentFiles.forEach(file => {
            const fileEntryDiv = document.createElement('li');
            fileEntryDiv.classList.add('file-item');
            fileEntryDiv.classList.add('recentFiles');

            // Extract a simple file name from the rawUrl
            const fileName = file.rawUrl.split('/').pop() || 'Unknown File';
            
            // Calculate time ago
            const viewedAt = new Date(file.viewedAt);
            const now = new Date();
            const diffMs = now - viewedAt;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let timeAgo;
            if (diffMins < 1) timeAgo = 'Just now';
            else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
            else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
            else timeAgo = `${diffDays}d ago`;

            // Create file info container
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'file-title';
            fileNameSpan.textContent = fileName;
            fileInfo.appendChild(fileNameSpan);
            
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'file-timestamp';
            timestampSpan.textContent = `Last accessed: ${timeAgo}`;
            fileInfo.appendChild(timestampSpan);
            
            fileEntryDiv.appendChild(fileInfo);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'file-buttons';
            fileEntryDiv.appendChild(buttonContainer);

            // View Button
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.className = 'view-button';
            viewButton.onclick = () => handleFileView(file.rawUrl, file.fileType);
            buttonContainer.appendChild(viewButton);

            // Download Button
            const downloadButton = document.createElement('button');
            downloadButton.textContent = file.fileType === 'code' ? 'Copy' : 'Download';
            downloadButton.className = 'download-button';
            downloadButton.onclick = () => handleFileDownload(file.rawUrl, file.fileType);
            buttonContainer.appendChild(downloadButton);

            recentFilesContainer2.appendChild(fileEntryDiv);
          });
        } catch (e) {
          console.error("Error displaying recent files:", e);
          recentFilesContainer.textContent = "Error loading recent files.";
        }
      }
      displayRecentFiles()


      // Close search when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          document.getElementById('searchInput').classList.remove('active');
          searchActive = false;
        }
      });

      // -------------------------------
      // Enhanced Share Functionality (Mobile Support)
      // -------------------------------
      async function copyToClipboardWithNotification(text, event) {
        if (notificationCooldown) return;
        notificationCooldown = true;

        try {
          // Mobile-friendly clipboard handling
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }

          const buttonRect = event ? event.target.getBoundingClientRect() : { left: '50%', top: '90%' };
          const notification = document.createElement('div');
          notification.className = 'share-notification';
          notification.textContent = "Link Copied!";

          // Mobile-responsive positioning
          const isMobile = true;
          Object.assign(notification.style, {
            position: 'fixed',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#00a521',
            fontSize: isMobile ? '14px' : '12px',
            fontWeight: 'bold',
            borderRadius: '5px',
            zIndex: '2000',
            left: isMobile ? '50%' : `${buttonRect.right - 2}px`,
            top: isMobile ? '90%' : `${buttonRect.top - 5}px`,
            transform: isMobile ? 'translate(-50%, -50%)' : 'translateX(-20px)',
            opacity: '0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap'
          });

          document.body.appendChild(notification);

          // Trigger animation
          requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = isMobile
              ? 'translate(-50%, -50%) scale(1)'
              : 'translateX(0) scale(1)';
          });

          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = isMobile
              ? 'translate(-50%, -50%) scale(0.9)'
              : 'translateX(10px) scale(0.9)';

            setTimeout(() => {
              notification.remove();
              notificationCooldown = false;
            }, 400);
          }, 1500);
        } catch (err) {
          console.error("Failed to copy text: ", err);
          notificationCooldown = false;
          // Fallback for iOS: Show prompt
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            prompt("Copy this URL:", text);
          }
        }
      }


      // -------------------------------
      // Restored Modal Transitions
      // -------------------------------
      function handleModalClose(modal) {
        return function () {
          displayRecentFiles()
          const modalContent = modal.querySelector('.modal-content');
          modalContent.classList.add('closing');
          document.body.classList.remove('modal-open');
          setTimeout(() => {
            modal.style.display = "none";
            modalContent.classList.remove('closing');

            // Reset modal content
            if (modal === pdfModal) pdfViewer.src = "";
            if (modal === imageModal) {
              imageViewer.src = "";
              currentImageList = [];
            }
            if (modal === codeModal) codeViewer.textContent = "";
          }, 200);
        };
      }

      function setupModal(modal, closeButton) {
        const closeFunction = handleModalClose(modal);

        // Close button click
        closeButton.onclick = closeFunction;

        // Outside click
        modal.addEventListener('click', (event) => {
          if (event.target === modal) closeFunction();
        });
      }

      // Initialize modals with transitions
      setupModal(pdfModal, closeModal);
      setupModal(imageModal, closeImageModal);
      setupModal(codeModal, closeCodeModal);

      // -------------------------------
      // Animated Folder Management
      // -------------------------------
      function handleFolderClick(event, folderElement) {
        const clickedElement = event.target;

        if (clickedElement.closest('.view-button') ||
          clickedElement.closest('.download-button') ||
          clickedElement.closest('.file-title')) {
          event.stopPropagation();
          return;
        }

        event.stopPropagation();

        const wasActive = folderElement.classList.contains('active');
        const parentContainer = folderElement.parentElement;

        folderElement.classList.remove('collapsing', 'expanding');

        if (!wasActive) {
          Array.from(parentContainer.children).forEach(child => {
            if (child !== folderElement && child.classList.contains('folder-node')) {
              if (child.classList.contains('active')) {
                child.classList.remove('active');
              }
            }
          });

          folderElement.classList.remove('active');
          void folderElement.offsetWidth;
          folderElement.classList.add('active');

        } else {
          folderElement.classList.remove('active');
        }
      }

      function createFolderElement(isNested = false) {
        const element = document.createElement(isNested ? 'div' : 'section');
        element.className = `${isNested ? 'nested-folder' : 'folder-section'} folder-node`;
        return element;
      }

      function createPinButton(folderPath, element) {
        const pinBtn = document.createElement('img');
        pinBtn.src = 'https://img.icons8.com/?size=100&id=XghFnrM2lzSW&format=png&color=000000';
        Object.assign(pinBtn.style, {
          position: 'absolute',
          top: '0',
          right: '0',
          width: '30px',
          height: '30px',
          cursor: 'pointer',
          opacity: pinnedFolders.includes(folderPath) ? '1' : '0.3',
          filter: 'invert(var(--reverse))',
          transition: 'opacity 0.2s ease'
        });
        pinBtn.onclick = (e) => {
          e.stopPropagation();
          const index = pinnedFolders.indexOf(folderPath);
          if (index > -1) {
            pinnedFolders.splice(index, 1);
          } else {
            pinnedFolders.push(folderPath);
          }
          localStorage.setItem('pinnedFolders', JSON.stringify(pinnedFolders));
          pinBtn.style.opacity = pinnedFolders.includes(folderPath) ? '1' : '0.3';
          reorderFolders(element.parentElement);
        };
        return pinBtn;
      }

      function reorderFolders(container) {
        const children = Array.from(container.children);
        const originalOrder = children.map(el => el.dataset.folderPath);
        const newOrder = [...children].sort((a, b) => {
          const aPinned = pinnedFolders.includes(a.dataset.folderPath);
          const bPinned = pinnedFolders.includes(b.dataset.folderPath);
          return bPinned - aPinned;
        }).map(el => el.dataset.folderPath);

        // Only reorder if positions actually change
        if (JSON.stringify(originalOrder) === JSON.stringify(newOrder)) return;

        // Disable transitions during reordering
        container.style.transition = 'none';
        children.sort((a, b) => {
          const aPinned = pinnedFolders.includes(a.dataset.folderPath);
          const bPinned = pinnedFolders.includes(b.dataset.folderPath);
          return bPinned - aPinned;
        }).forEach(child => container.appendChild(child));

        // Force reflow and restore transitions
        void container.offsetHeight;
        container.style.transition = '';
      }

      // -------------------------------
      // Filtered File Handling
      // -------------------------------
      const validExtensions = new Set([
        'pdf', 'jpg', 'jpeg', 'png', 'gif',
        'py', 'c', 'cpp', 'js', 'java', 'cs',
        'ts', 'go', 'rb', 'php', 'swift', 'rs',
        'html', 'css'
      ]);

      function createFileItem(fileName) {
        const li = document.createElement('li');
        li.className = 'file-item';

        const isPdfFile = fileName.toLowerCase().endsWith('.pdf');
        const fileIsCode = isCodeFile(fileName); // Use your existing isCodeFile function

        let innerHtmlContent = ``;

        if (isPdfFile) {
          innerHtmlContent += `<img src="https://img.icons8.com/?size=25&id=59859&format=png&color=000000" alt="PDF icon" class="file-icon">`;
        } else if (fileIsCode) { // Add this condition for code files
          innerHtmlContent += `<img src="https://img.icons8.com/?size=20&id=OTlhcalmkiBX&format=png&color=000000" alt="Code icon" class="file-icon code-file-icon">`;
        }

        innerHtmlContent += `
          <span class="file-title">${fileName}</span>
          <button class="view-button">View</button>
          <button class="download-button">${fileIsCode ? 'Copy' : 'Download'}</button>
        `;

        li.innerHTML = innerHtmlContent;
        return li;
      }

      function isCodeFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['py', 'c', 'cpp', 'js', 'java', 'cs', 'ts', 'go', 'rb', 'php', 'swift', 'rs', 'html', 'css'].includes(ext);
      }

      // -------------------------------
      // Global File View and Download Handlers
      // -------------------------------
      function handleFileView(rawUrl, fileType) {
        try {
          let recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];
          const newFile = { rawUrl, fileType, viewedAt: new Date().toISOString() };

          // Remove old entry if it exists to bring it to the front
          recentFiles = recentFiles.filter(file => file.rawUrl !== rawUrl);
          recentFiles.unshift(newFile); // Add to the beginning
          recentFiles = recentFiles.slice(0, 20); // Keep only the 20 most recent files
          localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
        } catch (e) {
          console.error("Error saving to local storage:", e);
        }

        if (fileType === 'pdf') {
          pdfViewer.src = `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;
          pdfModal.style.display = "flex";
          displayRecentFiles()
          document.body.classList.add('modal-open');
        } else if (fileType === 'code') {
          fetch(rawUrl)
            .then(response => response.text())
            .then(code => {
              codeViewer.textContent = code;
              codeModal.style.display = "block";
            });
        } else if (fileType === 'image') {
          imageViewer.src = rawUrl;
          imageModal.style.display = "block";
        }
      }

      function handleFileDownload(rawUrl, fileType) {
        if (fileType === 'code') {
          // Copy the code file URL to clipboard
          copyToClipboardWithNotification(rawUrl, { target: { getBoundingClientRect: () => ({ left: '50%', top: '90%' }) } });
        } else {
          window.open(rawUrl);
        }
      }

      // Make functions globally accessible
      window.handleFileView = handleFileView;
      window.handleFileDownload = handleFileDownload;

      // -------------------------------
      // Main Fetch Functions
      // -------------------------------

      // New function to fetch the entire repository tree at once
       function fetchRepositoryTree() {
        repoConfigs.forEach(async ({ owner, name }) => {
          console.log("Owner:", owner);
          console.log("Repo Name:", name);
          const repoOwner=owner
          const repoName=name
          const folderContainer = document.getElementById('folderContainer');
        folderContainer.innerHTML = '';

        try {
          // 1. Get the SHA for the main branch tree
          const branchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/branches/main`;
          const branchResponse = await fetch(branchUrl);
          const branchData = await branchResponse.json();
          const treeSha = branchData.commit.commit.tree.sha;

          // 2. Fetch the entire repository tree recursively
          const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${treeSha}?recursive=1`;
          const treeResponse = await fetch(treeUrl);
          const treeData = await treeResponse.json();

          // 3. Sort by path to ensure parents are created before children
          treeData.tree.sort((a, b) => a.path.localeCompare(b.path));

          // This map will store the reference to each folder's content container div
          const folderElementMap = {
            '': folderContainer
          };

          for (const item of treeData.tree) {
            if (item.path.includes('.DS_Store')) continue;

            const pathParts = item.path.split('/');
            const itemName = pathParts[pathParts.length - 1];
            const parentPath = pathParts.slice(0, -1).join('/');

            const parentContentContainer = folderElementMap[parentPath];
            if (!parentContentContainer) {
              console.warn(`Could not find parent element for path: ${item.path}`);
              continue;
            }

            // A. Handle directory creation ('tree')
            if (item.type === 'tree') {
              const isNested = parentPath !== '';
              const parentDomNode = isNested ? parentContentContainer.querySelector('.nested-folders') : parentContentContainer;

              const folderElement = createFolderElement(isNested);
              folderElement.dataset.folderPath = item.path;
              folderElement.dataset.repoOwner = repoOwner;
              folderElement.dataset.repoName = repoName;

              const headingContainer = document.createElement('div');
              headingContainer.style.position = 'relative';
              const heading = document.createElement(isNested ? 'h4' : 'h3');
              const folderNameWrapper = document.createElement('div');
              folderNameWrapper.className = 'folderName';

              if (!isNested) {
                const folderImage = document.createElement('img');
                folderImage.src = 'https://img.icons8.com/?size=100&id=2939&format=png&color=000000';
                folderImage.alt = 'Folder Icon';
                folderImage.style.width = '35px';
                folderImage.style.height = '35px';
                folderImage.style.marginRight = '10px';
                folderImage.style.verticalAlign = 'middle';
                folderNameWrapper.appendChild(folderImage);
              }

              folderNameWrapper.appendChild(document.createTextNode(itemName));
              heading.appendChild(folderNameWrapper);
              folderElement.onclick = (e) => handleFolderClick(e, folderElement);

              headingContainer.appendChild(heading);
              headingContainer.appendChild(createPinButton(item.path, folderElement));

              const newContentContainer = document.createElement('div');
              newContentContainer.className = 'folder-content';
              const fileList = document.createElement('ul');
              fileList.className = 'file-list';
              const nestedFoldersContainer = document.createElement('div');
              nestedFoldersContainer.className = 'nested-folders';
              newContentContainer.append(fileList, nestedFoldersContainer);

              folderElement.append(headingContainer, newContentContainer);
              parentDomNode.appendChild(folderElement);

              // Store the new folder's content area for its children to find
              folderElementMap[item.path] = newContentContainer;
            }
            // B. Handle file creation ('blob')
            else if (item.type === 'blob') {
              const fileList = parentContentContainer.querySelector('.file-list');
              if (!fileList) continue;

              if (itemName === 'links.txt') {
                const downloadUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${item.path}`;
                renderVideoCardsFromFile(downloadUrl, parentContentContainer);
                continue;
              }

              const ext = itemName.split('.').pop().toLowerCase();
              if (validExtensions && validExtensions.has(ext)) {
                const li = createFileItem(itemName);
                const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${item.path}`;

                li.dataset.rawUrl = rawUrl;
                li.dataset.fileType = isCodeFile(itemName) ? 'code' :
                  itemName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

                li.querySelector('.view-button').onclick = () => handleFileView(rawUrl, li.dataset.fileType);
                li.querySelector('.download-button').onclick = () => handleFileDownload(rawUrl, li.dataset.fileType);

                if (/\.(jpe?g|png|gif)$/i.test(itemName)) {
                  const img = document.createElement('img');
                  img.className = 'thumbnail';
                  img.src = rawUrl;
                  li.prepend(img);
                }
                fileList.appendChild(li);
              }
            }
          }

          document.dispatchEvent(new Event('folderContentLoaded'));
          reorderFolders(folderContainer);
          
          // Apply folder size display to all folders
          setTimeout(() => {
            const allFolders = document.querySelectorAll('.folder-node');
            if (window.addFolderSizeDisplay) {
              allFolders.forEach(folder => window.addFolderSizeDisplay(folder));
            }
          }, 300);

        } catch (error) {
          console.error("Error fetching repository tree:", error);
        }
        })      
        
      }


      // This function now just processes a file with video links
      async function renderVideoCardsFromFile(fileUrl, parentElement) {
        const getYouTubeThumbnail = (url) => {
          let videoId = null;
          try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
              videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
            } else if (urlObj.hostname.includes('googleusercontent.com')) {
              // Add robust extraction for googleusercontent URLs if needed
              videoId = urlObj.searchParams.get('v');
            }
          } catch (e) {
            console.error("Error parsing URL for thumbnail:", url, e);
          }
          return videoId ? `https://i.ytimg.com/vi/${videoId}/sddefault.jpg` : 'https://placehold.co/480x270/2a2a2a/ffffff?text=Video+Not+Found';
        };

        try {
          const response = await fetch(fileUrl);
          if (!response.ok) return;

          const csvData = await response.text();
          const rows = csvData.trim().split('\n').filter(row => row);
          if (rows.length === 0) return;

          const cardBox = document.createElement('div');
          cardBox.className = 'cardBox';

          rows.forEach(row => {
            const [videoUrl, title, description] = row.split(',').map(item => item.trim());
            if (!videoUrl || !title || !description) return;

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">
              <img src="${getYouTubeThumbnail(videoUrl)}" alt="${title}" onerror="this.onerror=null;this.src='https://placehold.co/480x270/ff0000/ffffff?text=Image+Failed';">
            </a>
            <h5 class="card-heading">${title}</h5>
            <p class="card-title">${description}</p>
          `;
            cardBox.appendChild(card);
          });
          // Prepend to the main content area of the folder, not the file list
          parentElement.prepend(cardBox);
        } catch (error) {
          console.error("Error processing video links file:", error);
        }
      }



      const showPinOnlyButton = document.querySelector('.showPinOnly');
      let showOnlyPinned = false;

      function updateFileDisplay() {
        const folderContainer = document.getElementById('folderContainer');
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        if (searchResults.style.display === 'block' && searchInput.value.trim() !== '') {
          return;
        }

        folderContainer.style.display = 'flex';
        searchResults.style.display = 'none';

        const allFolderSections = document.querySelectorAll('.folder-section.folder-node');

        allFolderSections.forEach(folderSection => {
          const folderPath = folderSection.dataset.folderPath;

          let shouldDisplayFolder = false;

          if (showOnlyPinned) {
            if (pinnedFolders.includes(folderPath)) {
              shouldDisplayFolder = true;
            }
          } else {
            shouldDisplayFolder = true;
          }

          if (shouldDisplayFolder) {
            folderSection.style.display = 'block';
            const filesInFolder = folderSection.querySelectorAll('.file-element');
            filesInFolder.forEach(file => {
              file.style.display = '';
            });
          } else {
            folderSection.style.display = 'none';
          }
        });

        const rootFiles = Array.from(document.querySelectorAll('.file-element')).filter(file =>
          !file.closest('.folder-section')
        );

        rootFiles.forEach(file => {
          const fileId = file.dataset.fileId;
          const isPinned = pinnedFolders.includes(fileId);

          if (showOnlyPinned) {
            if (isPinned) {
              file.style.display = '';
            } else {
              file.style.display = 'none';
            }
          } else {
            file.style.display = '';
          }
        });
      }


      if (showPinOnlyButton) {
        showPinOnlyButton.addEventListener('click', () => {
          showOnlyPinned = !showOnlyPinned;

          if (showOnlyPinned) {
            showPinOnlyButton.classList.add('active');
          } else {
            showPinOnlyButton.classList.remove('active');
          }

          updateFileDisplay();
        });
      }
      // -------------------------------
      // Theme Toggle
      // -------------------------------
      const themeToggle = document.getElementById('themeToggle');
      const rootElement = document.documentElement;
      const savedTheme = localStorage.getItem('theme') || 'light';

      rootElement.setAttribute('data-theme', savedTheme);
      themeToggle.innerHTML = savedTheme === 'dark'
        ? '<img src="https://img.icons8.com/?size=100&id=54382&format=png&color=000000" style="width:25px;height:25px; filter: invert(1);">'
        : '<img src="https://img.icons8.com/?size=100&id=9313&format=png&color=000000" style="width:25px;height:25px;">';

      themeToggle.onclick = () => {
        const newTheme = rootElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        rootElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark'
          ? '<img src="https://img.icons8.com/?size=100&id=54382&format=png&color=000000" style="width:25px;height:25px; filter: invert(1);">'
          : '<img src="https://img.icons8.com/?size=100&id=9313&format=png&color=000000" style="width:25px;height:25px;">';
      };

      // -------------------------------
      // Search Initialization
      // -------------------------------
      function initializeSearch() {
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');
        const mainElement = document.querySelector('main');
        const folderContainer = document.getElementById('folderContainer');

        // Create search results container
        const searchResults = document.createElement('div');
        searchResults.id = 'searchResults';
        searchResults.style.display = 'none';
        mainElement.appendChild(searchResults);

        // Store original file items reference
        let allFileElements = [];

        // Update file collection whenever content loads
        function updateFileElements() {
          allFileElements = Array.from(document.querySelectorAll('.file-item'));
          console.log('Files available for search:', allFileElements.length);
        }

        // Initial collection after load
        document.addEventListener('DOMContentLoaded', updateFileElements);

        // Update when new content loads
        document.addEventListener('folderContentLoaded', updateFileElements);

        function performSearch() {
          const searchTerm = searchInput.value.trim().toLowerCase();

          if (!searchTerm) {
            // If search term is empty, show original structure and hide results
            folderContainer.style.display = 'flex';
            searchResults.style.display = 'none';

            // Ensure all original files and their folder sections are visible
            allFileElements.forEach(file => {
              file.style.display = ''; // Reset display for the file itself
              const folderSection = file.closest('.folder-section');
              if (folderSection) { // Check if .folder-section ancestor exists
                folderSection.style.display = 'block'; // Ensure its parent folder is visible
              }
            });
            return;
          }

          // Hide original structure when search term is present
          folderContainer.style.display = 'none';

          // Show search results container and clear previous results
          searchResults.style.display = 'block';
          searchResults.innerHTML = '<h2>Search Results :</h2>';

          // Find matches
          const matches = allFileElements.filter(file => {
            const fileTitleElement = file.querySelector('.file-title');
            if (fileTitleElement) { // Check if .file-title element exists
              const fileName = fileTitleElement.textContent.toLowerCase();
              return fileName.includes(searchTerm);
            }
            return false; // If .file-title is not found, it's not a match
          });

          console.log('Found matches:', matches.length);

          if (matches.length === 0) {
            searchResults.innerHTML = '<h2>No matching files were found.</h2>';
          } else {
            // Display matches
            matches.forEach(originalFile => {
              const clone = originalFile.cloneNode(true); // Clone the file element

              // Reattach event handlers for the cloned elements
              // Assuming handleFileView and handleFileDownload are globally accessible functions
              const newViewBtn = clone.querySelector('.view-button');
              const newDownloadBtn = clone.querySelector('.download-button');

              // Get original data attributes from the original element
              const rawUrl = originalFile.dataset.rawUrl;
              const fileType = originalFile.dataset.fileType;

              if (newViewBtn) {
                newViewBtn.onclick = () => handleFileView(rawUrl, fileType);
              }
              if (newDownloadBtn) {
                newDownloadBtn.onclick = () => handleFileDownload(rawUrl, fileType);
              }

              searchResults.appendChild(clone);
            });
          }
        }

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('input', performSearch);
      }

      // Initialize
      fetchRepositoryTree();
      initializeSearch();
    })
    .catch(error => {
      console.error('Error loading configuration:', error);
    });
  const aiBtn = document.getElementById('aiChatBtn');
  const aiModal = document.getElementById('aiModal');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendChatBtn = document.getElementById('sendChat');
  const closeAiModal = aiModal.querySelector('.close');

  // Fade in
  function fadeIn(el, duration = 250) {
    el.style.opacity = 0;
    el.style.display = 'block';
    el.style.transition = `opacity ${duration}ms ease-in-out`;
    requestAnimationFrame(() => {
      el.style.opacity = 1;
    });
  }

  // Fade out
  function fadeOut(el, duration = 500, callback) {
    el.style.opacity = 1;
    el.style.transition = `opacity ${duration}ms ease-in-out`;
    requestAnimationFrame(() => {
      el.style.opacity = 0;
    });
    setTimeout(() => {
      el.style.display = 'none';
      if (callback) callback();
    }, duration);
  }

  // Open modal
  aiBtn.addEventListener('click', () => {
    aiModal.style.opacity = 0;
    aiModal.style.display = 'block';
    aiModal.style.transition = 'opacity 500ms ease-in-out';
    requestAnimationFrame(() => {
      aiModal.style.opacity = 1;
    });
  });

  // Close modal
  closeAiModal.addEventListener('click', () => {
    fadeOut(aiModal, 500);
  });

  // Send message
  function sendMessage() {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    appendMessage(userMsg, 'user');
    chatInput.value = '';

    generateBotResponse(userMsg).then(botReply => {
      appendMessage(botReply, 'bot');
    });
  }

  // Append message
  function appendMessage(message, sender) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('chat-message');
    msgEl.classList.add(sender === 'user' ? 'chat-bot' : 'chat-user');
    msgEl.style.opacity = 0;
    msgEl.textContent = message;
    chatMessages.appendChild(msgEl);
    requestAnimationFrame(() => {
      msgEl.style.transition = 'opacity 500ms ease-in-out';
      msgEl.style.opacity = 1;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function generateBotResponse(userInput) {
    const payload = {
      contents: [
        {
          parts: [{ text: userInput }]
        }
      ]
    };

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("Gemini API response:", data);

      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return textResponse || "🤖 Sorry, no response from A.I.";
    } catch (error) {
      console.error("Error contacting Gemini API:", error);
      return "⚠️ Error fetching response. Try again.";
    }
  }


  // Bind events
  sendChatBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

});
// Get references to your elements
const appLogoButton = document.getElementById('appLogoButton');
const folderContainer = document.querySelector('main');
const aboutDiv = document.querySelector('.about'); // Use querySelector for class

// State variable to track which section is active
let isAboutSectionActive = false; // Initially, home/folders are active

// Function to update the display
function toggleAppContent() {
  isAboutSectionActive = !isAboutSectionActive; // Toggle the state

  if (isAboutSectionActive) {
    // Show About, Hide FolderContainer
    folderContainer.classList.remove('active');
    // Wait for folderContainer to fade out before truly hiding
    setTimeout(() => {
      folderContainer.style.display = 'none';
      aboutDiv.style.display = 'block'; // Make about visible for transition
      // Trigger reflow to ensure display change is applied before opacity transition
      void aboutDiv.offsetWidth;
      aboutDiv.classList.add('active');
    }, 300); // Match CSS transition duration
  } else {
    // Show FolderContainer, Hide About
    aboutDiv.classList.remove('active');
    // Wait for aboutDiv to fade out before truly hiding
    setTimeout(() => {
      aboutDiv.style.display = 'none';
      folderContainer.style.display = 'flex'; // Make folderContainer visible for transition
      // Ensure folderContainer has the correct display type (flex or block)
      // Trigger reflow to ensure display change is applied before opacity transition
      void folderContainer.offsetWidth;
      folderContainer.classList.add('active');
    }, 300); // Match CSS transition duration
  }
}

// Attach the event listener to the logo button
if (appLogoButton) {
  appLogoButton.addEventListener('click', toggleAppContent);
}


document.addEventListener('DOMContentLoaded', () => {
  folderContainer.classList.add('active');
  folderContainer.style.display = 'flex'; // Ensure initial display is correct
  aboutDiv.style.display = 'none'; // Ensure about is hidden initially
});

function clearRecentFiles() {
  const recentFilesContainer = document.getElementById('recentFilesContainer');
  const recentFilesContainer2 = document.getElementById('recentFilesContainer2');
  if (!recentFilesContainer) {
    console.error("Error: 'recentFilesContainer' element not found.");
    return;
  }

  const fileItems = recentFilesContainer.querySelectorAll('.recentFiles');
  const fileItems2 = recentFilesContainer2.querySelectorAll('.recentFiles');
  if (fileItems.length === 0) {
    console.log("No recent files to clear.");
    return;
  }

  let itemsRemovedCount = 0;
  const totalItems = fileItems.length;

  fileItems.forEach((item, index) => {
    // Add a class that triggers the CSS transition for swipe and fade-out
    item.classList.add('removing-file');

    // Add a slight delay for staggered animation, making it look nicer
    item.style.transitionDelay = `${index * 0.25}s !important`;

    // Listen for the end of the transition
    item.addEventListener('transitionend', function handler() {
      // Remove the element from the DOM after the transition
      item.remove();
      itemsRemovedCount++;

      // Once all items have been removed, clear localStorage and update the container text
      if (itemsRemovedCount === totalItems) {
        localStorage.removeItem('recentFiles');
        recentFilesContainer.textContent = "No recent files to display.";
        console.log("Recent files cleared successfully.");
      }
      // Remove the event listener to prevent it from firing multiple times if re-added
      item.removeEventListener('transitionend', handler);
    });
  });
  fileItems2.forEach((item, index) => {
    // Add a class that triggers the CSS transition for swipe and fade-out
    item.classList.add('removing-file');

    // Add a slight delay for staggered animation, making it look nicer
    item.style.transitionDelay = `${index * 0.25}s !important`;

    // Listen for the end of the transition
    item.addEventListener('transitionend', function handler() {
      // Remove the element from the DOM after the transition
      item.remove();
      itemsRemovedCount++;

      // Once all items have been removed, clear localStorage and update the container text
      if (itemsRemovedCount === totalItems) {
        localStorage.removeItem('recentFiles');
        recentFilesContainer.textContent = "No recent files to display.";
        console.log("Recent files cleared successfully.");
      }
      // Remove the event listener to prevent it from firing multiple times if re-added
      item.removeEventListener('transitionend', handler);
    });
  });
}

// Attach the clearRecentFiles function to the clearRecent button
document.addEventListener('DOMContentLoaded', () => {
  const clearButton = document.getElementById('clearRecent');
  if (clearButton) {
    clearButton.onclick = clearRecentFiles;
  }
});

// ===============================
// FEATURE IMPLEMENTATIONS
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
      rateLimitElement.innerHTML = `
        <div class="rate-limit-info">
          <span>API Requests: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}</span>
          <span>Resets at: ${resetTime}</span>
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

    // Estimate size based on file types (rough approximation)
    fileItems.forEach(item => {
      const fileName = item.querySelector('.file-title').textContent;
      const ext = fileName.split('.').pop().toLowerCase();

      // Rough size estimates in KB
      const sizeEstimates = {
        'pdf': 500,
        'jpg': 200, 'jpeg': 200, 'png': 150, 'gif': 100,
        'py': 5, 'js': 8, 'html': 10, 'css': 15,
        'c': 3, 'cpp': 5, 'java': 8, 'cs': 6
      };

      totalSize += sizeEstimates[ext] || 10;
    });

    return { fileCount, totalSize };
  }

  function addFolderSizeDisplay(folderElement) {
    const folderPath = folderElement.dataset.folderPath;
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
        font-size: 0.8em;
        color: var(--folder-text-light);
        margin: 10px;
        font-weight: normal;
      `;
      sizeInfo.textContent = `(${fileCount} files, ~${Math.round(totalSize)}KB)`;
      heading.appendChild(sizeInfo);
    }
  }

  // Add size tracking to existing folders
  document.addEventListener('folderContentLoaded', () => {
    const folders = document.querySelectorAll('.folder-node');
    folders.forEach(addFolderSizeDisplay);
  });
}

// 3. Enhanced Recent Files with Timestamps
function enhanceRecentFilesWithTimestamps() {

  window.displayRecentFiles = function () {
    const recentFilesContainer = document.getElementById('recentFilesContainer');
    const recentFilesContainer2 = document.getElementById('recentFilesContainer2');

    if (!recentFilesContainer) return;

    recentFilesContainer.innerHTML = '';
    recentFilesContainer2.innerHTML = '';

    try {
      const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];

      if (recentFiles.length === 0) {
        recentFilesContainer.textContent = "No recent files to display.";
        recentFilesContainer2.innerHTML = "No recent files to display.";
        return;
      }

      recentFiles.forEach(file => {
        [recentFilesContainer, recentFilesContainer2].forEach(container => {
          const fileEntryDiv = document.createElement('li');
          fileEntryDiv.classList.add('file-item', 'recentFiles');

          const fileName = file.rawUrl.split('/').pop() || 'Unknown File';
          const viewedAt = new Date(file.viewedAt);
          const timeAgo = getTimeAgo(viewedAt);

          fileEntryDiv.innerHTML = `
            <div class="file-info">
              <span class="file-title">${fileName}</span>
              <span class="file-timestamp">${timeAgo}</span>
            </div>
            <div class="file-buttons">
              <button class="view-button">View</button>
              <button class="download-button">Download</button>
            </div>
          `;

          fileEntryDiv.querySelector('.view-button').onclick = () => handleFileView(file.rawUrl, file.fileType);
          fileEntryDiv.querySelector('.download-button').onclick = () => handleFileDownload(file.rawUrl, file.fileType);

          container.appendChild(fileEntryDiv);
        });
      });
    } catch (e) {
      console.error("Error displaying recent files:", e);
    }
  };

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
}

// 4. Smooth CSS Transitions Enhancement
function enhanceCSSTransitions() {
  const style = document.createElement('style');
  style.textContent = `
    /* Enhanced Smooth Transitions */
    .folder-node {
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .folder-content {
      transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.3s ease,
                  transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .modal {
      transition: opacity 0.3s ease, backdrop-filter 0.3s ease !important;
    }
    
    .modal-content {
      transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.3s ease !important;
    }
    
    button {
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .file-item {
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .thumbnail {
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .thumbnail:hover {
      transform: scale(1.1) rotate(2deg) !important;
    }
  `;
  document.head.appendChild(style);
}

// 5. Stopwatch and Sound Features
function initializeStopwatchAndSound() {
  let stopwatchInterval;
  let stopwatchTime = 0;
  let isRunning = false;

  // Create stopwatch UI
  const stopwatchContainer = document.createElement('div');
  stopwatchContainer.id = 'stopwatchContainer';
  stopwatchContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--folder-bg);
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999;
    display: none;
    min-width: 200px;
  `;

  stopwatchContainer.innerHTML = `
    <div class="stopwatch-display">
      <span id="stopwatchTime">00:00:00</span>
    </div>
    <div class="stopwatch-controls">
      <button id="startStopBtn">Start</button>
      <button id="resetBtn">Reset</button>
      <button id="soundBtn">🔊</button>
    </div>
  `;

  document.body.appendChild(stopwatchContainer);

  // Create toggle button
  const stopwatchToggle = document.createElement('button');
  stopwatchToggle.innerHTML = '⏱️';
  stopwatchToggle.style.cssText = `
    position: fixed;
    bottom: 130px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--folder-bg);
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 998;
  `;

  document.body.appendChild(stopwatchToggle);

  // Stopwatch functionality
  function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchTime / 3600);
    const minutes = Math.floor((stopwatchTime % 3600) / 60);
    const seconds = stopwatchTime % 60;

    document.getElementById('stopwatchTime').textContent =
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function startStopwatch() {
    if (!isRunning) {
      stopwatchInterval = setInterval(() => {
        stopwatchTime++;
        updateStopwatchDisplay();
      }, 1000);
      isRunning = true;
      document.getElementById('startStopBtn').textContent = 'Stop';
    } else {
      clearInterval(stopwatchInterval);
      isRunning = false;
      document.getElementById('startStopBtn').textContent = 'Start';
    }
  }

  function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    isRunning = false;
    updateStopwatchDisplay();
    document.getElementById('startStopBtn').textContent = 'Start';
  }

  // Sound generation using Web Audio API
  function createSound(frequency, duration, type = 'sine') {
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
  }

  // Event listeners
  stopwatchToggle.onclick = () => {
    const isVisible = stopwatchContainer.style.display === 'block';
    stopwatchContainer.style.display = isVisible ? 'none' : 'block';
  };

  document.getElementById('startStopBtn').onclick = startStopwatch;
  document.getElementById('resetBtn').onclick = resetStopwatch;
  document.getElementById('soundBtn').onclick = () => {
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

  // Track file access - we'll enhance the existing function
  const originalHandleFileView = window.handleFileView;

  // Create enhanced version that tracks usage
  function enhancedHandleFileView(rawUrl, fileType) {
    usageData.filesAccessed++;
    const today = new Date().toDateString();
    if (!usageData.dailyStats[today]) {
      usageData.dailyStats[today] = { filesAccessed: 0, timeSpent: 0 };
    }
    usageData.dailyStats[today].filesAccessed++;
    localStorage.setItem('usageData', JSON.stringify(usageData));

    // Call the original handleFileView function that's defined in the main scope
    if (typeof handleFileView === 'function') {
      return handleFileView(rawUrl, fileType);
    }
  }

  // We'll set this up after the main functions are defined
  window.enhancedHandleFileView = enhancedHandleFileView;

  // Create dashboard UI
  function createUsageDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'usageDashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--folder-bg);
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 1001;
      display: none;
      max-width: 500px;
      width: 90%;
    `;

    const hours = Math.floor(usageData.timeSpent / 3600);
    const minutes = Math.floor((usageData.timeSpent % 3600) / 60);

    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h2>Usage Dashboard</h2>
        <button id="closeDashboard" style="float: right; background: none; border: none; font-size: 24px;">×</button>
      </div>
      <div class="dashboard-content">
        <div class="stat-item">
          <div class="stat-label">Total Time Spent</div>
          <div class="stat-value">${hours}h ${minutes}m</div>
        </div>
        
        <div class="rate-limit-section">
          <h3>API Status</h3>
          <div id="rateLimitDisplay">Loading...</div>
        </div>
      </div>
    `;

    document.body.appendChild(dashboard);

    document.getElementById('closeDashboard').onclick = () => {
      dashboard.style.display = 'none';
    };

    return dashboard;
  }

  function calculateStudyStreak() {
    const dailyStats = usageData.dailyStats;
    const dates = Object.keys(dailyStats).sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;

    for (const date of dates) {
      if (dailyStats[date].filesAccessed > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Create dashboard toggle button
  const dashboardToggle = document.createElement('button');
  dashboardToggle.innerHTML = '📊';
  dashboardToggle.style.cssText = `
    position: fixed;
    bottom: 185px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--folder-bg);
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 998;
  `;

  document.body.appendChild(dashboardToggle);

  dashboardToggle.onclick = () => {
    let dashboard = document.getElementById('usageDashboard');
    if (!dashboard) {
      dashboard = createUsageDashboard();
    }
    dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
  };

  // Save data on page unload
  window.addEventListener('beforeunload', updateTimeSpent);
}

// Initialize all enhancements
enhanceRecentFilesWithTimestamps();
enhanceCSSTransitions();

// Add CSS for new features
const enhancementStyles = document.createElement('style');
enhancementStyles.textContent = `
  .file-info {
    display: flex;
    flex-direction: column;
  }
  
  .file-timestamp {
    font-size: 0.8em;
    color: var(--folder-text-light);
    font-style: italic;
  }
  
  .file-buttons {
    display: flex;
    gap: 10px;
  }
  
  .folder-size-info {
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .folder-node:hover .folder-size-info {
    opacity: 1;
  }
  
  .stopwatch-display {
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 10px;
    color: var(--text-color);
  }
  
  .stopwatch-controls {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  
  .stopwatch-controls button {
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    background: var(--button-view-bg);
    color: var(--text-color);
    cursor: pointer;
  }
  
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  

  
  .stat-label {
    font-weight: bold;
    color: var(--text-color);
  }
  
  .stat-value {
    color: var(--folder-text-light);
  }
  
  .rate-limit-info {
    display: flex;
    gap: 5px;
    font-size: 1.2em;
    color: var(--text-color);
  }
  
  .rate-limit-section h3 {
    margin: 0 0 10px 0;
    color: var(--text-color);
  }
`;

document.head.appendChild(enhancementStyles);