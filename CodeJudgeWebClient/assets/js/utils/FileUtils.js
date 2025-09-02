export async function readFileAsArray(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split('\n').map(line => line.trim()));
        reader.onerror = reject;
        reader.readAsText(file);
    });
}