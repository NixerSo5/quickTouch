document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('openEdgeButton').addEventListener('click', () => {
        window.electronAPI.openEdgeBrowser();
    });
});
