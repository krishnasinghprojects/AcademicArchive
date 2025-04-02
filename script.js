document.addEventListener('DOMContentLoaded', () => {
  const repoOwner = "KrishnaSingh1920";
  const repoName = "AcademicArchiveDB";
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

  // Modal elements for Code
  const codeModal = document.getElementById('codeModal');
  const closeCodeModal = document.getElementById('closeCodeModal');
  const codeViewer = document.getElementById('codeViewer');

  // Variables to track current image index and list
  let currentImageIndex = 0;
  let currentImageList = [];

  // Variables to store current share URLs for each modal
  let currentPdfShareUrl = "";
  let currentCodeShareUrl = "";
  let currentImageShareUrl = "";

  // -------------------------------
  // Share Functionality with fallback notification
  // -------------------------------

// Prevents spam clicks
let notificationCooldown = false;

async function copyToClipboardWithNotification(text, event) {
    if (notificationCooldown) return;
    notificationCooldown = true;

    try {
        await navigator.clipboard.writeText(text);

        // Create notification element
        let notification = document.createElement('div');
        notification.textContent = "✔ Link copied to share!";
        notification.style.position = 'absolute';
        notification.style.padding = '6px 10px';
        notification.style.backgroundColor = 'rgba(95, 255, 70, 0.9)';
        notification.style.color = 'white';
        notification.style.fontSize = '10px';
        notification.style.fontWeight = 'bold';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '2000';  // Ensure visibility
        notification.style.whiteSpace = 'nowrap';
        notification.style.opacity = '0';
        notification.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-in-out';

        document.body.appendChild(notification); // Append before measuring

        // Get button position
        let buttonRect = event.target.getBoundingClientRect();
        notification.style.left = `${buttonRect.right + 10}px`;
        notification.style.top = `${buttonRect.top - 4}px`;
        notification.style.transform = 'translateX(-20px)';

        // Trigger fade-in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remove after 2 sec
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => {
                notification.remove();
                notificationCooldown = false;
            }, 400);
        }, 2000);

    } catch (err) {
        console.error("Failed to copy text: ", err);
        notificationCooldown = false;
    }
}

// Function to add share button inside modals
function addShareButton(modalElement, shareCallback) {
    const modalContent = modalElement.querySelector('.modal-content') || modalElement; // Fallback if `.modal-content` doesn't exist
    if (!modalContent) {
        console.error("Modal content not found for", modalElement);
        return;
    }

    const shareBtn = document.createElement('img');
    shareBtn.src = 'https://img.icons8.com/?size=100&id=3447&format=png&color=000000';
    shareBtn.alt = 'Share';
    shareBtn.style.position = 'absolute';
    shareBtn.style.top = '10px';
    shareBtn.style.left = '10px';
    shareBtn.style.width = '16px';
    shareBtn.style.height = '16px';
    shareBtn.style.cursor = 'pointer';
    shareBtn.style.zIndex = '2000'; // Ensure visibility

    shareBtn.addEventListener('click', shareCallback);
    modalContent.appendChild(shareBtn);
    return shareBtn;
}

// Add share buttons to modals
const pdfShareBtn = addShareButton(pdfModal, (event) => {
    if (!currentPdfShareUrl) return console.error("No URL for PDF modal");
    const viewerUrl = "https://docs.google.com/gview?url=" + encodeURIComponent(currentPdfShareUrl) + "&embedded=true";
    copyToClipboardWithNotification(viewerUrl, event);
});

const codeShareBtn = addShareButton(codeModal, (event) => {
    if (!currentCodeShareUrl) return console.error("No URL for code modal");
    copyToClipboardWithNotification(currentCodeShareUrl, event);
});

const imageShareBtn = addShareButton(imageModal, (event) => {
    if (!currentImageShareUrl) return console.error("No URL for image modal");
    copyToClipboardWithNotification(currentImageShareUrl, event);
});


  // -------------------------------
  // Pinned folders localStorage
  // -------------------------------
  let pinnedFolders = loadPinnedFolders();

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

  function isFolderPinned(folderPath) {
    return pinnedFolders.includes(folderPath);
  }

  function togglePinFolder(folderPath, folderElement) {
    if (isFolderPinned(folderPath)) {
      pinnedFolders = pinnedFolders.filter(p => p !== folderPath);
    } else {
      pinnedFolders.push(folderPath);
    }
    savePinnedFolders();
    reorderFolders(folderElement.parentElement);
  }

  function reorderFolders(parentContainer) {
    if (!parentContainer) return;
    const children = Array.from(parentContainer.children);
    const sortedChildren = children.slice().sort((a, b) => {
      const pathA = a.dataset.folderPath;
      const pathB = b.dataset.folderPath;
      const pinnedA = pinnedFolders.includes(pathA);
      const pinnedB = pinnedFolders.includes(pathB);
      if (pinnedA && !pinnedB) return -1;
      if (!pinnedA && pinnedB) return 1;
      return 0;
    });
    sortedChildren.forEach((child, i) => {
      if (parentContainer.children[i] !== child) {
        parentContainer.appendChild(child);
      }
    });
  }

  // -------------------------------
  // Modal Close Helpers
  // -------------------------------
  function closePdfModal() {
    const modalContent = pdfModal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
      pdfModal.style.display = "none";
      pdfViewer.src = "";
      modalContent.classList.remove('closing');
    }, 200);
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
    }, 200);
  }

  function closeCodeModalWithTransition() {
    const modalContent = codeModal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
      codeModal.style.display = "none";
      codeViewer.textContent = "";
      modalContent.classList.remove('closing');
    }, 200);
  }

  closeModal.addEventListener('click', closePdfModal);
  closeImageModal.addEventListener('click', closeImageModalWithTransition);
  closeCodeModal.addEventListener('click', closeCodeModalWithTransition);

  window.addEventListener('click', (event) => {
    if (event.target === pdfModal) closePdfModal();
    if (event.target === imageModal) closeImageModalWithTransition();
    if (event.target === codeModal) closeCodeModalWithTransition();
  });

  // -------------------------------
  // Navigation for Image Modal
  // -------------------------------
  prevImageBtn.addEventListener('click', () => {
    if (currentImageList.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
      imageViewer.style.opacity = 0;
      setTimeout(() => {
        imageViewer.src = currentImageList[currentImageIndex];
        currentImageShareUrl = currentImageList[currentImageIndex];
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
        currentImageShareUrl = currentImageList[currentImageIndex];
        imageViewer.style.opacity = 1;
      }, 300);
    }
  });

  // -------------------------------
  // File Type Helpers
  // -------------------------------
  const codeExtensions = ['.py', '.c', '.cpp', '.js', '.java', '.cs', '.ts', '.go', '.rb', '.php', '.swift', '.rs', '.html', '.css'];

  function isCodeFile(filename) {
    const lower = filename.toLowerCase();
    return codeExtensions.some(ext => lower.endsWith(ext));
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  // -------------------------------
  // Fetch Folders and Files
  // -------------------------------
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
        pinBtn.style.opacity = isFolderPinned(folder.name) ? '1.0' : '0.3';

        pinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePinFolder(folder.name, section);
          pinBtn.style.opacity = isFolderPinned(folder.name) ? '1.0' : '0.3';
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

            const viewBtn = document.createElement('button');
            viewBtn.textContent = "View";
            viewBtn.className = 'view-button';
            viewBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${folderPath}/${item.name}`;
              const codeResponse = await fetch(rawUrl);
              const codeText = await codeResponse.text();
              codeViewer.textContent = codeText;
              currentCodeShareUrl = rawUrl;
              codeModal.style.display = "block";
            });

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
              currentPdfShareUrl = rawUrl;
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
              currentImageShareUrl = rawUrl;
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
          const nestedFolder = document.createElement('div');
          nestedFolder.className = 'nested-folder';
          const nestedFullPath = `${folderPath}/${item.name}`;
          nestedFolder.dataset.folderPath = nestedFullPath;

          const headingContainer = document.createElement('div');
          headingContainer.style.position = 'relative';

          const nestedHeading = document.createElement('h4');
          nestedHeading.textContent = item.name;
          headingContainer.appendChild(nestedHeading);

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
          await fetchFolderContents(nestedFullPath, nestedFolder, nestedFullPath);
        }
      }
      reorderFolders(parentElement.querySelector('.nested-folders'));
    } catch (error) {
      console.error(`Error fetching contents for folder ${folderPath}:`, error);
    }
  }

  fetchFolders();
});

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const rootElement = document.documentElement;

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
