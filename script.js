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

  // -------------------------------
  // Enhanced Share Functionality
  // -------------------------------
  async function copyToClipboardWithNotification(text, event) {
    if (notificationCooldown) return;
    notificationCooldown = true;

    try {
      await navigator.clipboard.writeText(text);
      const buttonRect = event.target.getBoundingClientRect();
      const notification = document.createElement('div');
      notification.textContent = "Copied Link to Share!";
      Object.assign(notification.style, {
        position: 'fixed',
        padding: '5px 10px',
        backgroundColor: 'rgba(255, 255, 255, 0)',
        color: 'rgb(0, 165, 33)',
        fontSize: '12px',
        fontWeight: 'bold',
        borderRadius: '4px',
        zIndex: '2000',
        left: `${buttonRect.right - 2}px`,
        top: `${buttonRect.top-5}px`,
        opacity: '0',
        transform: 'translateX(-20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
      });

      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 10);

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(10px)';
        setTimeout(() => notification.remove(), 300);
        notificationCooldown = false;
      }, 750);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      notificationCooldown = false;
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
    return function() {
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
          
          li.querySelector('.view-button').onclick = async () => {
            if (isCodeFile(item.name)) {
              const code = await (await fetch(rawUrl)).text();
              codeViewer.textContent = code;
              currentCodeShareUrl = rawUrl;
              codeModal.style.display = "block";
            } else if (item.name.toLowerCase().endsWith('.pdf')) {
              pdfViewer.src = `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;
              currentPdfShareUrl = rawUrl;
              pdfModal.style.display = "block";
            } else {
              currentImageList = Array.from(parentElement.querySelectorAll('img.thumbnail')).map(img => img.src);
              currentImageIndex = currentImageList.indexOf(rawUrl);
              imageViewer.src = rawUrl;
              currentImageShareUrl = rawUrl;
              imageModal.style.display = "block";
            }
          };

          li.querySelector('.download-button').onclick = (e) => {
            isCodeFile(item.name) 
              ? copyToClipboardWithNotification(rawUrl, e)
              : window.open(item.download_url);
          };

          if (/\.(jpe?g|png|gif)$/i.test(item.name)) {
            const img = document.createElement('img');
            img.className = 'thumbnail';
            img.src = rawUrl;
            li.prepend(img);
          }

          fileList.appendChild(li);
        } else if (item.type === "dir") {
          const nestedFolder = createFolderElement(true);
          nestedFolder.dataset.folderPath = `${folderPath}/${item.name}`;

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

  // Initialize
  fetchFolders();
  addShareButton(pdfModal, () => currentPdfShareUrl);
  addShareButton(codeModal, () => currentCodeShareUrl);
  addShareButton(imageModal, () => currentImageShareUrl);
})
.catch(error => {
  console.error('Error loading configuration:', error);

});
});