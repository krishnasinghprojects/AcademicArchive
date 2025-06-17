document.addEventListener('DOMContentLoaded', () => {

  fetch('data.json')
    .then(response => response.json())
    .then(data => {

      const repoConfigs = data.repoConfigs;
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
            return;
          }

          recentFiles.forEach(file => {
            const fileEntryDiv = document.createElement('li');
            fileEntryDiv.classList.add('file-item');
            fileEntryDiv.classList.add('recentFiles');
            // No styling classes here, relying on external CSS

            // Extract a simple file name from the rawUrl
            const fileName = file.rawUrl.split('/').pop() || 'Unknown File';
            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = fileName;
            fileEntryDiv.appendChild(fileNameSpan);

            const buttonContainer = document.createElement('div');
            fileEntryDiv.appendChild(buttonContainer);

            // View Button
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.onclick = () => handleFileView(file.rawUrl, file.fileType);
            buttonContainer.appendChild(viewButton);

            // Download Button
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.onclick = () => handleFileDownload(file.rawUrl, file.fileType);
            buttonContainer.appendChild(downloadButton);


            viewButton.classList.add('view-button');
            downloadButton.classList.add('download-button');

            recentFilesContainer.appendChild(fileEntryDiv);
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

      function addShareButton(modal, getUrlCallback) {
        const shareBtn = document.createElement('img');
        shareBtn.src = 'https://img.icons8.com/?size=100&id=3447&format=png&color=000000';
        Object.assign(shareBtn.style, {
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '16px',
          height: '16px',
          cursor: 'pointer',
          zIndex: '2000',
          filter: 'invert(var(--reverse))'
        });
        shareBtn.onclick = (e) => copyToClipboardWithNotification(getUrlCallback(), e);
        modal.querySelector('.modal-content').appendChild(shareBtn);
      }

      // -------------------------------
      // Restored Modal Transitions
      // -------------------------------
      function handleModalClose(modal) {
        return function () {
          displayRecentFiles()
          const modalContent = modal.querySelector('.modal-content');
          modalContent.classList.add('closing');
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
        event.stopPropagation();
        const wasActive = folderElement.classList.contains('active');
        const parentContainer = folderElement.parentElement;

        // Add animation classes
        folderElement.classList.add(wasActive ? 'collapsing' : 'expanding');

        // Collapse siblings
        if (!wasActive) {
          Array.from(parentContainer.children).forEach(child => {
            if (child !== folderElement && child.classList.contains('folder-node')) {
              child.classList.add('collapsing');
              child.classList.remove('active', 'expanding');
            }
          });
        }

        // Toggle active state after animation
        setTimeout(() => {
          folderElement.classList.toggle('active', !wasActive);
          folderElement.classList.remove(wasActive ? 'collapsing' : 'expanding');
        }, 10);
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
          pdfModal.style.display = "block";
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

      // -------------------------------
      // Main Fetch Functions
      // -------------------------------

      async function fetchFolders() {


        try {
          const fetchPromises = repoConfigs.map(repo =>
            fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/contents/`)
              .then(response => response.json())
              .then(data => data.map(item => ({
                ...item,
                repoOwner: repo.owner,
                repoName: repo.name
              })))
          );

          const allItemsArrays = await Promise.all(fetchPromises);
          const items = allItemsArrays.flat();

          const folderContainer = document.getElementById('folderContainer');
          folderContainer.innerHTML = '';

          items.filter(item => item.type === "dir").forEach(folder => {
            const section = createFolderElement();
            section.dataset.folderPath = folder.name;
            section.dataset.repoOwner = folder.repoOwner;
            section.dataset.repoName = folder.repoName;

            const headingContainer = document.createElement('div');
            headingContainer.style.position = 'relative';

            const heading = document.createElement('h3');

            const folderNameWrapper = document.createElement('div');
            folderNameWrapper.className = 'folderName';

            const folderImage = document.createElement('img');
            folderImage.src = 'https://img.icons8.com/?size=100&id=2939&format=png&color=000000';
            folderImage.alt = 'Folder Icon';
            folderImage.style.width = '35px';
            folderImage.style.height = '35px';
            folderImage.style.marginRight = '10px';
            folderImage.style.verticalAlign = 'middle';

            folderNameWrapper.appendChild(folderImage);
            folderNameWrapper.appendChild(document.createTextNode(folder.name));

            heading.appendChild(folderNameWrapper);
            folderNameWrapper.onclick = (e) => handleFolderClick(e, section);

            headingContainer.appendChild(heading);
            headingContainer.appendChild(createPinButton(folder.name, section));

            const contentContainer = document.createElement('div');
            contentContainer.className = 'folder-content';
            section.append(headingContainer, contentContainer);
            folderContainer.appendChild(section);

            fetchFolderContents(folder.repoOwner, folder.repoName, folder.name, contentContainer);
          });
          reorderFolders(folderContainer);
        } catch (error) {
          console.error("Error fetching folders:", error);
        }
      }

      async function fetchFolderContents(repoOwner, repoName, folderPath, parentElement) {
        try {
          const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`);
          const items = await response.json();

          const renderVideoCardsFromFile = async (fileUrl) => {
            const getYouTubeThumbnail = (url) => {
              let videoId = null;
              try {
                const urlObj = new URL(url);

                // **PRIORITY 1: Standard YouTube URLs**
                // Handles:
                // - youtube.com?v=VIDEO_ID
                // - youtube.com?si=...&v=VIDEO_ID
                // - youtube.com/watch?v=VIDEO_ID
                if (urlObj.hostname.includes('youtube.com')) {
                  videoId = urlObj.searchParams.get('v');
                }
                // Handles:
                // - youtu.be/VIDEO_ID (short URL)
                else if (urlObj.hostname === 'youtu.be') {
                  // Extracts VIDEO_ID from /VIDEO_ID
                  videoId = urlObj.pathname.substring(1);
                  if (videoId.includes('/')) { // If there are more slashes, take the first segment
                    videoId = videoId.split('/')[0];
                  }
                }
                // Handles:
                // - https://www.youtube.com/watch?v=VIDEO_ID/embed/VIDEO_ID
                // - https://www.youtube.com/watch?v=VIDEO_ID/v/VIDEO_ID
                // - https://www.youtube.com/watch?v=VIDEO_ID/watch?v=VIDEO_ID
                else if (urlObj.hostname === 'https://www.youtube.com/watch?v=VIDEO_ID' || urlObj.hostname.includes('youtube.com')) {
                  // Try to get from 'v' parameter first
                  videoId = urlObj.searchParams.get('v');

                  if (!videoId) {
                    // If not found, check path segments for common embed/v patterns
                    const pathSegments = urlObj.pathname.split('/');
                    const embedIndex = pathSegments.indexOf('embed');
                    const vIndex = pathSegments.indexOf('v');

                    if (embedIndex > -1 && embedIndex + 1 < pathSegments.length) {
                      videoId = pathSegments[embedIndex + 1];
                    } else if (vIndex > -1 && vIndex + 1 < pathSegments.length) {
                      videoId = pathSegments[vIndex + 1];
                    } else if (pathSegments.length > 1 && pathSegments[1].length === 11) { // Common for youtu.be/VIDEO_ID where VIDEO_ID is 11 chars
                      videoId = pathSegments[1];
                    }
                  }
                }
                else if (urlObj.hostname.includes('googleusercontent.com')) {
                  // Attempt to extract from 'v' parameter
                  videoId = urlObj.searchParams.get('v');
                  if (!videoId) {
                    // Attempt to find 11-character string in pathname, common for video IDs
                    const pathSegments = urlObj.pathname.split('/').filter(Boolean); // Filter Boolean removes empty strings
                    for (const segment of pathSegments) {
                      if (segment.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(segment)) { // Check for typical video ID characters
                        videoId = segment;
                        break;
                      }
                    }
                  }
                }

              } catch (e) {
                console.error("Error parsing URL for thumbnail:", url, e);
              }

              // Return the thumbnail URL or a placeholder if videoId is not found
              return videoId ? `https://img.youtube.com/vi/${videoId}/sddefault.jpg` : 'https://placehold.co/480x270/2a2a2a/ffffff?text=Video+Not+Found';
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
              parentElement.prepend(cardBox);
            } catch (error) {
              console.error("Error processing video links file:", error);
            }
          };

          const validItems = items.filter(item => {
            if (item.name === '.DS_Store') return false;
            if (item.name === 'links.txt') {
              renderVideoCardsFromFile(item.download_url);
              return false;
            }

            if (item.type === 'file') {
              const ext = item.name.split('.').pop().toLowerCase();
              return validExtensions.has(ext);
            }
            return true;
          });

          const fileList = document.createElement('ul');
          fileList.className = 'file-list';

          const nestedContainer = document.createElement('div');
          nestedContainer.className = 'nested-folders';

          parentElement.append(fileList, nestedContainer);

          for (const item of validItems) {
            if (item.type === "file") {
              const li = createFileItem(item.name);
              const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;

              li.dataset.rawUrl = rawUrl;
              li.dataset.fileType = isCodeFile(item.name) ? 'code' :
                item.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

              li.querySelector('.view-button').onclick = () => handleFileView(rawUrl, li.dataset.fileType);
              li.querySelector('.download-button').onclick = (e) => handleFileDownload(rawUrl, li.dataset.fileType);

              if (/\.(jpe?g|png|gif)$/i.test(item.name)) {
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.src = rawUrl;
                li.prepend(img);
              }

              fileList.appendChild(li);
              document.dispatchEvent(new Event('folderContentLoaded'));

            } else if (item.type === "dir") {
              const nestedFolder = createFolderElement(true);
              const newFolderPath = `${folderPath}/${item.name}`;
              nestedFolder.dataset.folderPath = newFolderPath;
              nestedFolder.dataset.repoOwner = repoOwner;
              nestedFolder.dataset.repoName = repoName;

              const folderLi = document.createElement('li');
              folderLi.className = 'file-item';
              folderLi.dataset.rawUrl = `https://github.com/${repoOwner}/${repoName}/tree/master/${newFolderPath}`;
              folderLi.dataset.fileType = 'folder';
              folderLi.innerHTML = `
                        <span class="file-title">${item.name}</span>
                        <button class="view-button">Open</button>
                    `;
              allFileElements.push(folderLi);

              const headingContainer = document.createElement('div');
              headingContainer.style.position = 'relative';

              const heading = document.createElement('h4');
              heading.textContent = item.name;
              heading.onclick = (e) => handleFolderClick(e, nestedFolder);
              headingContainer.appendChild(heading);
              headingContainer.appendChild(createPinButton(nestedFolder.dataset.folderPath, nestedFolder));

              const contentContainer = document.createElement('div');
              contentContainer.className = 'folder-content';
              nestedFolder.append(headingContainer, contentContainer);
              nestedContainer.appendChild(nestedFolder);

              fetchFolderContents(repoOwner, repoName, newFolderPath, contentContainer);
              document.dispatchEvent(new Event('folderContentLoaded'));
            }
          }
          reorderFolders(nestedContainer);
        } catch (error) {
          console.error(`Error fetching ${folderPath} from ${repoOwner}/${repoName}:`, error);
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
            folderContainer.style.display = 'flex';
            searchResults.style.display = 'none';
            allFileElements.forEach(file => {
              file.style.display = '';
              file.closest('.folder-section').style.display = 'block';
            });
            return;
          }

          // Hide original structure
          folderContainer.style.display = 'none';

          // Show search results container
          searchResults.style.display = 'block';
          searchResults.innerHTML = '<h2>Search Results :</h2>';

          // Find matches
          const matches = allFileElements.filter(file => {
            const fileName = file.querySelector('.file-title').textContent.toLowerCase();
            return fileName.includes(searchTerm);
          });

          console.log('Found matches:', matches.length);
          if (matches.length === 0) {
            searchResults.innerHTML = '<h2>No matching files were found.</h2>';

          }
          // Display matches
          matches.forEach(originalFile => {
            const clone = originalFile.cloneNode(true);

            // Reattach click handlers using global handlers
            const newViewBtn = clone.querySelector('.view-button');
            const newDownloadBtn = clone.querySelector('.download-button');
            const rawUrl = originalFile.dataset.rawUrl;
            const fileType = originalFile.dataset.fileType;

            newViewBtn.onclick = () => handleFileView(rawUrl, fileType);
            newDownloadBtn.onclick = () => handleFileDownload(rawUrl, fileType);

            searchResults.appendChild(clone);
          });
        }

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('input', performSearch);
      }

      // Initialize
      fetchFolders();
      initializeSearch();
      addShareButton(pdfModal, () => currentPdfShareUrl);
      addShareButton(codeModal, () => currentCodeShareUrl);
      addShareButton(imageModal, () => currentImageShareUrl);
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
  if (!recentFilesContainer) {
    console.error("Error: 'recentFilesContainer' element not found.");
    return;
  }

  const fileItems = recentFilesContainer.querySelectorAll('.recentFiles');
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
}

// Attach the clearRecentFiles function to the clearRecent button
document.addEventListener('DOMContentLoaded', () => {
  const clearButton = document.getElementById('clearRecent');
  if (clearButton) {
    clearButton.onclick = clearRecentFiles;
  }
});