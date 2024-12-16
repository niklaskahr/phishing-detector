export class FileReaderUtil {
    static async readFileAsText(file: File): Promise<string> {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = (event) => {
                const fileContent = event.target?.result as string;
                if (!fileContent) {
                    reject(new Error('File is empty or could not be read.'));
                } else {
                    resolve(fileContent);
                }
            };

            reader.onerror = (error) => {
                reject(new Error(`Error reading file: ${error}`));
            };

            reader.readAsText(file);
        });
    }
}
