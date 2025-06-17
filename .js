async function fetchFolderContents(repoOwner, repoName, folderPath, parentElement) {
    parentElement.innerHTML = '';
  
    const validExtensions = new Set(['pdf', 'js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'cs', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'md', 'json', 'txt']);
  
    const isCodeFile = (fileName) => {
      if (typeof fileName !== 'string' || !fileName) return false;
      const codeExtensions = ['.js', '.html', '.css', '.py', '.java', '.cpp', '.c', '.cs', '.rb', '.php', '.go', '.rs', '.swift', '.kt', '.json'];
      return codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };
  
    const createAndAppendFileItem = (item) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      
      let iconHtml = '';
      const fileName = item.name;
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const isCode = isCodeFile(fileName);
  
      if (item.type === 'dir') {
          li.classList.add('folder-item');
          iconHtml = `<img src="https://img.icons8.com/?size=25&id=23315&format=png&color=000000" alt="Folder icon" class="file-icon">`;
      } else if (isPdf) {
        iconHtml = `<img src="https://img.icons8.com/?size=25&id=59859&format=png&color=000000" alt="PDF icon" class="file-icon">`;
      } else if (isCode) {
        iconHtml = `<img src="https://img.icons8.com/?size=20&id=OTlhcalmkiBX&format=png&color=000000" alt="Code icon" class="file-icon code-file-icon">`;
      }
  
      li.innerHTML = `
        ${iconHtml}
        <span class="file-title">${fileName}</span>
        <button class="view-button">View</button>
        <button class="download-button">${isCode ? 'Copy' : 'Download'}</button>
      `;
  
      li.dataset.filePath = item.path;
      li.dataset.fileType = item.type;
      parentElement.appendChild(li);
    };
  
    const renderVideoCardsFromFile = async (fileUrl) => {
      const getYouTubeThumbnail = (url) => {
        let videoId = null;
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
          } else if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.substring(1);
          }
        } catch (e) {
          console.error("Could not parse URL for thumbnail:", url);
        }
        return videoId ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg` : 'https://placehold.co/480x270/2a2a2a/ffffff?text=Video';
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
  
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`);
      if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
      }
      const allItems = await response.json();
  
      for (const item of allItems) {
        if (item.name.toLowerCase() === 'links.txt') {
          await renderVideoCardsFromFile(item.download_url);
          continue;
        }
  
        if (item.name === '.DS_Store') {
          continue;
        }
        
        if (item.type === 'dir') {
          createAndAppendFileItem(item);
        } else if (item.type === 'file') {
          const ext = item.name.split('.').pop().toLowerCase();
          console.log(item)
          if (validExtensions.has(ext)) {
            createAndAppendFileItem(item);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch or process folder contents:", error);
      parentElement.innerHTML = `<div class="file-item error">Failed to load repository content.</div>`;
    }
  }
  