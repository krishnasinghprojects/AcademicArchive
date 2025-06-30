# Academic Archive

Academic Archive is a web platform built with pure HTML, CSS, and JavaScript for managing and accessing academic materials directly from GitHub repositories. This open-source project is fully client-side, requiring no frameworks or build process. It focuses on providing seamless access to notes, syllabi, and code, ensuring that all content is up-to-date and easily accessible. It is built to support community contributions, allowing anyone to review the code or collaborate on the content.

---

## Key Features

-   **Multi-Repository Folder Rendering:** The platform can render content from multiple GitHub repositories, offering a comprehensive and integrated view of diverse academic sources.
-   **Content on Demand:** Easily access a wide range of academic materials, including notes, syllabi, and code, directly from your GitHub repositories.
-   **Folder-Based Organization:** Structure your academic content within folders for a clean, organized, and streamlined Browse experience.
-   **Powerful Search:** A responsive search bar allows you to quickly find any resource, even within nested folders, ensuring you can locate what you need without delay.
-   **Enhanced Viewing:** Enjoy a smooth viewing experience with integrated modals for PDFs, images, and code snippets, allowing you to preview content without leaving the page.

---

## Additional Features & Enhancements

-   **Customizable Interface:**
    -   Switch between **dark and light modes** to suit your viewing preference.
    -   Use the **pin button** for quick access to your most important folders.
    -   A dedicated **toggle button for pinned folders** allows you to filter your view to see only pinned items, enhancing focus and privacy.
-   **Dynamic Folder Management:**
    -   Main folders feature a dropdown toggle to keep the interface clean and uncluttered.
    -   Folders automatically collapse to maintain a well-organized structure.
-   **Flexible Repository Management:**
    -   Repository details are stored in a simple `repositories.json` file, making it easy for non-technical users to update repository names or owners without touching the codebase.
-   **Collaborative Model:**
    -   The open-source nature of the project encourages code review and community contributions.
    -   The database repository is designed to support multiple content collaborators, making it a truly community-driven platform.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

1. All you need is a modern web browser.
2. A code editor like VS Code is recommended for making modifications.

### Running the Project Locally

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/academic-archive.git](https://github.com/your-username/academic-archive.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd academic-archive
    ```
3.  **Open the main HTML file:**
    Simply open the `index.html` file in your web browser. You can do this by double-clicking the file or by dragging it into an open browser window. That's it!

    *Pro Tip: For the best experience during development (to avoid potential browser security issues with local files), it's recommended to use a live server. If you use VS Code, you can install the "Live Server" extension, right-click on `index.html`, and select "Open with Live Server".*

---

## How to Use

### Adding Your Repositories

To add your own GitHub repositories to the Academic Archive, you need to modify the `repositories.json` file.

1.  Open the `repositories.json` file in the project's root or data directory.
2.  Follow the existing format to add a new repository object. You will need to provide the repository owner's GitHub username and the name of the repository.

    ```json
    [
      {
        "owner": "github-username-1",
        "repo": "repository-name-1"
      },
      {
        "owner": "github-username-2",
        "repo": "repository-name-2"
      }
    ]
    ```
3.  Save the `repositories.json` file and **reload** the `index.html` page in your browser. The application will then fetch and display the content from your updated list of repositories.

### Organizing Content

To ensure your content is displayed correctly, organize your files in folders within your GitHub repositories. The platform will mirror the folder structure, making it easy to navigate.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

---

## Contact

Krishna Singh - krishnasinghprojects@gmail.com

Project Link - [https://krishnasinghprojects.github.io/AcademicArchive/](https://krishnasinghprojects.github.io/AcademicArchive/)
