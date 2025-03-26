document.addEventListener('DOMContentLoaded', () => {
  const repoOwner = "KrishnaSingh1920";
  const repoName = "AcedemicArchiveDB";
  const rootApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

  // Modal elements for PDF
  const pdfModal = document.getElementById('pdfModal');
  const closeModal = document.getElementById('closeModal');
  const pdfViewer = document.getElementById('pdfViewer');

  // Modal elements for Image
  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const imageViewer = document.getElementById('imageViewer');
  const prevImageBtn = document.getElementById('prevImage');
  const nextImageBtn = document.getElementById('nextImage');

  // New: Code Modal Elements
  const codeModal = document.getElementById('codeModal');
  const closeCodeModal = document.getElementById('closeCodeModal');
  const codeViewer = document.getElementById('codeViewer');

  // Variables to track current image index and list
  let currentImageIndex = 0;
  let currentImageList = [];

  // -------------------------------
  // Pinned folders localStorage
  // -------------------------------
  let pinnedFolders = loadPinnedFolders(); // pinnedFolders is an array of folder paths that have been pinned

  function loadPinnedFolders() {
    try {
      const stored = localStorage.getItem('pinnedFolders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function savePinnedFolders() {
    localStorage.setItem('pinnedFolders', JSON.stringify(pinnedFolders));
  }

  // Helper function to check if a folder path is pinned
  function isFolderPinned(folderPath) {
    return pinnedFolders.includes(folderPath);
  }

  // Helper function to toggle pinned status of a folder path
  function togglePinFolder(folderPath, folderElement) {
    if (isFolderPinned(folderPath)) {
      pinnedFolders = pinnedFolders.filter(p => p !== folderPath);
    } else {
      pinnedFolders.push(folderPath);
    }
    savePinnedFolders();
    reorderFolders(folderElement.parentElement); // Reorder folders in the parent container
  }

  // Reorders child folders so pinned ones come first
  function reorderFolders(parentContainer) {
    if (!parentContainer) return;
    const children = Array.from(parentContainer.children);
    children.sort((a, b) => {
      const pathA = a.dataset.folderPath;
      const pathB = b.dataset.folderPath;
      const pinnedA = pinnedFolders.includes(pathA);
      const pinnedB = pinnedFolders.includes(pathB);
      if (pinnedA && !pinnedB) return -1;
      if (!pinnedA && pinnedB) return 1;
      return 0;
    });
    children.forEach(child => {
      parentContainer.appendChild(child);
    });
  }
  // -------------------------------

  // Helper functions to close modals with transition
  function closePdfModal() {
    const modalContent = pdfModal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
      pdfModal.style.display = "none";
      pdfViewer.src = "";
      modalContent.classList.remove('closing');
    }, 500);
  }

  function closeImageModalWithTransition() {
    const modalContent = imageModal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
      imageModal.style.display = "none";
      imageViewer.src = "";
      currentImageList = [];
      currentImageIndex = 0;
      modalContent.classList.remove('closing');
    }, 500);
  }

  function closeCodeModalWithTransition() {
    const modalContent = codeModal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
      codeModal.style.display = "none";
      codeViewer.textContent = "";
      modalContent.classList.remove('closing');
    }, 500);
  }

  // Modal close event listeners
  closeModal.addEventListener('click', closePdfModal);
  closeImageModal.addEventListener('click', closeImageModalWithTransition);
  closeCodeModal.addEventListener('click', closeCodeModalWithTransition);

  window.addEventListener('click', (event) => {
    if (event.target === pdfModal) closePdfModal();
    if (event.target === imageModal) closeImageModalWithTransition();
    if (event.target === codeModal) closeCodeModalWithTransition();
  });

  // Navigation for image modal
  prevImageBtn.addEventListener('click', () => {
    if (currentImageList.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
      imageViewer.style.opacity = 0;
      setTimeout(() => {
        imageViewer.src = currentImageList[currentImageIndex];
        imageViewer.style.opacity = 1;
      }, 300);
    }
  });

  nextImageBtn.addEventListener('click', () => {
    if (currentImageList.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
      imageViewer.style.opacity = 0;
      setTimeout(() => {
        imageViewer.src = currentImageList[currentImageIndex];
        imageViewer.style.opacity = 1;
      }, 300);
    }
  });

  // Array of common code file extensions
  const codeExtensions = ['.py', '.c', '.cpp', '.js', '.java', '.cs', '.ts', '.go', '.rb', '.php', '.swift', '.rs'];

  // Utility to check if a file is recognized as code
  function isCodeFile(filename) {
    const lower = filename.toLowerCase();
    return codeExtensions.some(ext => lower.endsWith(ext));
  }

  // Helper function to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
    }
  }

  // Fetch top-level folders
  async function fetchFolders() {
    try {
      const response = await fetch(rootApiUrl);
      const items = await response.json();
      const folders = items.filter(item => item.type === "dir");
      const folderContainer = document.getElementById('folderContainer');
      folderContainer.innerHTML = '';
      folderContainer.style.width = "100%";

      folders.forEach(folder => {
        const section = document.createElement('section');
        section.className = 'folder-section';
        section.dataset.folderPath = folder.name;

        const headingContainer = document.createElement('div');
        headingContainer.style.position = 'relative';

        const heading = document.createElement('h3');
        heading.textContent = folder.name;
        headingContainer.appendChild(heading);

        // Pin button for top-level folder
        const pinBtn = document.createElement('img');
        pinBtn.src = 'https://img.icons8.com/?size=100&id=7873&format=png&color=000000';
        pinBtn.alt = 'Pin Folder';
        pinBtn.style.position = 'absolute';
        pinBtn.style.top = '0';
        pinBtn.style.right = '0';
        pinBtn.style.width = '24px';
        pinBtn.style.height = '24px';
        pinBtn.style.cursor = 'pointer';
        pinBtn.style.opacity = isFolderPinned(folder.name) ? '1.0' : '0.5';

        pinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePinFolder(folder.name, section);
          pinBtn.style.opacity = isFolderPinned(folder.name) ? '1.0' : '0.6';
        });

        headingContainer.appendChild(pinBtn);
        section.appendChild(headingContainer);

        const contentContainer = document.createElement('div');
        contentContainer.className = 'folder-content';
        section.appendChild(contentContainer);

        folderContainer.appendChild(section);
        fetchFolderContents(folder.name, contentContainer, folder.name);
      });

      reorderFolders(folderContainer);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  // Recursive function to fetch contents of a folder (files and subfolders)
  async function fetchFolderContents(folderPath, parentElement, fullFolderPath) {
    const folderApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`;
    try {
      const response = await fetch(folderApiUrl);
      const items = await response.json();
      
      const fileList = document.createElement('ul');
      fileList.className = 'file-list';
      parentElement.appendChild(fileList);
      
      const nestedContainer = document.createElement('div');
      nestedContainer.className = 'nested-folders';
      parentElement.appendChild(nestedContainer);
      
      for (const item of items) {
        if (item.type === "file") {
          const lowerName = item.name.toLowerCase();

          if (isCodeFile(item.name)) {
            const li = document.createElement('li');
            li.className = 'file-item';

            const title = document.createElement('span');
            title.textContent = item.name;
            title.className = 'file-title';

            // "View" button for code
            const viewBtn = document.createElement('button');
            viewBtn.textContent = "View";
            viewBtn.className = 'view-button';
            viewBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;
              const codeResponse = await fetch(rawUrl);
              const codeText = await codeResponse.text();
              codeViewer.textContent = codeText;
              codeModal.style.display = "block";
            });

            // "Copy" button for code
            const copyBtn = document.createElement('button');
            copyBtn.textContent = "Copy";
            copyBtn.className = 'download-button';
            copyBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;
              const codeResponse = await fetch(rawUrl);
              const codeText = await codeResponse.text();
              await copyToClipboard(codeText);
            });

            li.appendChild(title);
            li.appendChild(viewBtn);
            li.appendChild(copyBtn);
            fileList.appendChild(li);
          }
          else if (lowerName.endsWith('.pdf')) {
            const li = document.createElement('li');
            li.className = 'file-item';

            const title = document.createElement('span');
            title.textContent = item.name;
            title.className = 'file-title';

            const viewBtn = document.createElement('button');
            viewBtn.textContent = "View";
            viewBtn.className = 'view-button';
            viewBtn.addEventListener('click', (e) => {
              e.preventDefault();
              const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;
              const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;
              pdfViewer.src = viewerUrl;
              pdfModal.style.display = "block";
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = "Download";
            downloadBtn.className = 'download-button';
            downloadBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.open(item.download_url);
            });

            li.appendChild(title);
            li.appendChild(viewBtn);
            li.appendChild(downloadBtn);
            fileList.appendChild(li);
          }
          else if (/\.(jpe?g|png|gif)$/i.test(item.name)) {
            const li = document.createElement('li');
            li.className = 'file-item';

            const img = document.createElement('img');
            const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;
            img.src = rawUrl;
            img.alt = item.name;
            img.className = 'thumbnail';

            const caption = document.createElement('span');
            caption.textContent = item.name;
            caption.className = 'file-title';

            const viewBtn = document.createElement('button');
            viewBtn.textContent = "View";
            viewBtn.className = 'view-button';
            viewBtn.addEventListener('click', (e) => {
              e.preventDefault();
              const imageElements = parentElement.querySelectorAll('img.thumbnail');
              currentImageList = Array.from(imageElements).map(imgEl => imgEl.src);
              currentImageIndex = currentImageList.indexOf(rawUrl);
              imageViewer.src = rawUrl;
              imageModal.style.display = "block";
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = "Download";
            downloadBtn.className = 'download-button';
            downloadBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.open(item.download_url);
            });

            li.appendChild(img);
            li.appendChild(caption);
            li.appendChild(viewBtn);
            li.appendChild(downloadBtn);
            fileList.appendChild(li);
          }
        } 
        else if (item.type === "dir") {
          // For nested folders, create a flex item inside nestedContainer
          const nestedFolder = document.createElement('div');
          nestedFolder.className = 'nested-folder';
          
          // Store full path for nested folder pinning
          const nestedFullPath = `${folderPath}/${item.name}`;
          nestedFolder.dataset.folderPath = nestedFullPath;

          // Heading container with pin button
          const headingContainer = document.createElement('div');
          headingContainer.style.position = 'relative';

          const nestedHeading = document.createElement('h4');
          nestedHeading.textContent = item.name;
          headingContainer.appendChild(nestedHeading);

          // Pin button for nested folder (same as main folder)
          const pinBtn = document.createElement('img');
          pinBtn.src = 'https://img.icons8.com/?size=100&id=7873&format=png&color=000000';
          pinBtn.alt = 'Pin Folder';
          pinBtn.style.position = 'absolute';
          pinBtn.style.top = '0';
          pinBtn.style.right = '0';
          pinBtn.style.width = '20px';
          pinBtn.style.height = '20px';
          pinBtn.style.cursor = 'pointer';
          pinBtn.style.opacity = isFolderPinned(nestedFullPath) ? '1.0' : '0.6';

          pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePinFolder(nestedFullPath, nestedFolder);
            pinBtn.style.opacity = isFolderPinned(nestedFullPath) ? '1.0' : '0.6';
          });

          headingContainer.appendChild(pinBtn);
          nestedFolder.appendChild(headingContainer);

          nestedContainer.appendChild(nestedFolder);
          // Recursively fetch contents for this nested folder
          await fetchFolderContents(nestedFullPath, nestedFolder, nestedFullPath);
        }
      }

      // After loading items, reorder pinned nested folders
      reorderFolders(parentElement.querySelector('.nested-folders'));
    } catch (error) {
      console.error(`Error fetching contents for folder ${folderPath}:`, error);
    }
  }

  // Initialize top-level folders
  fetchFolders();
});
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const rootElement = document.documentElement;

  // Check for a saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    rootElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
  }

  themeToggle.addEventListener('click', () => {
    let currentTheme = rootElement.getAttribute('data-theme') || 'light';
    let newTheme = currentTheme === 'light' ? 'dark' : 'light';
    rootElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
  });

  function updateToggleIcon(theme) {
    if (theme === 'dark') {
      themeToggle.innerHTML = '<img src="https://img.icons8.com/?size=100&id=54382&format=png&color=000000" alt="Dark Mode" style="width:30px;height:30px; filter: invert(1);">';
    } else {
      themeToggle.innerHTML = '<img src="https://img.icons8.com/?size=100&id=9313&format=png&color=000000" alt="Light Mode" style="width:30px;height:30px;">';
    }
  }
  
});
