document.addEventListener('DOMContentLoaded', () => {

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const repoOwner = data.repoOwner;
      const repoName = data.repoName;
      const rootApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
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
        pinBtn.src = 'https://img.icons8.com/?size=100&id=7873&format=png&color=000000';
        Object.assign(pinBtn.style, {
          position: 'absolute',
          top: '0',
          right: '0',
          width: '24px',
          height: '24px',
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
        li.innerHTML = `
          <span class="file-title">${fileName}</span>
          <button class="view-button">View</button>
          <button class="download-button">${isCodeFile(fileName) ? 'Copy' : 'Download'}</button>
        `;
        return li;
      }

      function isCodeFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['py', 'c', 'cpp', 'js', 'java', 'cs', 'ts', 'go', 'rb', 'php', 'swift', 'rs', 'html', 'css'].includes(ext);
      }

      // -------------------------------
      // Image Navigation
      // -------------------------------
      prevImageBtn.onclick = () => navigateImages(-1);
      nextImageBtn.onclick = () => navigateImages(1);

      function navigateImages(direction) {
        currentImageIndex = (currentImageIndex + direction + currentImageList.length) % currentImageList.length;
        imageViewer.style.opacity = 0;
        setTimeout(() => {
          imageViewer.src = currentImageList[currentImageIndex];
          imageViewer.style.opacity = 1;
        }, 300);
      }

      // -------------------------------
      // Global File View and Download Handlers
      // -------------------------------
      function handleFileView(rawUrl, fileType) {
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
          const response = await fetch(rootApiUrl);
          const items = await response.json();
          const folderContainer = document.getElementById('folderContainer');
          folderContainer.innerHTML = '';

          items.filter(item => item.type === "dir").forEach(folder => {
            const section = createFolderElement();
            section.dataset.folderPath = folder.name;

            const headingContainer = document.createElement('div');
            headingContainer.style.position = 'relative';

            const heading = document.createElement('h3');
            heading.textContent = folder.name;
            heading.onclick = (e) => handleFolderClick(e, section);
            headingContainer.appendChild(heading);
            headingContainer.appendChild(createPinButton(folder.name, section));

            const contentContainer = document.createElement('div');
            contentContainer.className = 'folder-content';
            section.append(headingContainer, contentContainer);
            folderContainer.appendChild(section);

            fetchFolderContents(folder.name, contentContainer);
          });

          reorderFolders(folderContainer);
        } catch (error) {
          console.error("Error fetching folders:", error);
        }
      }

      async function fetchFolderContents(folderPath, parentElement) {
        try {
          const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`);
          const items = await response.json();

          // Filter out unwanted files
          const validItems = items.filter(item => {
            if (item.name === '.DS_Store') return false;
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

              // Add dataset attributes here ▼
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

              // Dispatch event to update file collection
              document.dispatchEvent(new Event('folderContentLoaded'));
            } else if (item.type === "dir") {
              const nestedFolder = createFolderElement(true);
              nestedFolder.dataset.folderPath = `${folderPath}/${item.name}`;

              const folderLi = document.createElement('li');
              folderLi.className = 'file-item';
              folderLi.dataset.rawUrl = `https://github.com/${repoOwner}/${repoName}/tree/master/${folderPath}/${item.name}`;
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

              fetchFolderContents(`${folderPath}/${item.name}`, contentContainer);

              document.dispatchEvent(new Event('folderContentLoaded'));
            }
          }
          reorderFolders(nestedContainer);
        } catch (error) {
          console.error(`Error fetching ${folderPath}:`, error);
        }
      }

      // -------------------------------
      // Theme Toggle
      // -------------------------------
      const themeToggle = document.getElementById('themeToggle');
      const rootElement = document.documentElement;
      const savedTheme = localStorage.getItem('theme') || 'light';

      rootElement.setAttribute('data-theme', savedTheme);
      themeToggle.innerHTML = savedTheme === 'dark'
        ? '<img src="https://img.icons8.com/?size=100&id=54382&format=png&color=000000" style="width:30px;height:30px; filter: invert(1);">'
        : '<img src="https://img.icons8.com/?size=100&id=9313&format=png&color=000000" style="width:30px;height:30px;">';

      themeToggle.onclick = () => {
        const newTheme = rootElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        rootElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark'
          ? '<img src="https://img.icons8.com/?size=100&id=54382&format=png&color=000000" style="width:30px;height:30px; filter: invert(1);">'
          : '<img src="https://img.icons8.com/?size=100&id=9313&format=png&color=000000" style="width:30px;height:30px;">';
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
          searchResults.innerHTML = '';

          // Find matches
          const matches = allFileElements.filter(file => {
            const fileName = file.querySelector('.file-title').textContent.toLowerCase();
            return fileName.includes(searchTerm);
          });

          console.log('Found matches:', matches.length);

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
