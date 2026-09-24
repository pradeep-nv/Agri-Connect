import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RFConnector {
  async predict(input) {
    return new Promise((resolve, reject) => {
      // Path to the Python script
      const scriptPath = path.join(__dirname, 'rf_model.py');

      // Spawn Python process
      const pythonProcess = spawn('python', [scriptPath]);

      let resultData = '';
      let errorData = '';

      // Send input data to Python via stdin
      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        resultData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}: ${errorData}`);
          return reject(new Error("Random Forest prediction failed"));
        }

        try {
          const result = JSON.parse(resultData);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error("Failed to parse Random Forest output"));
        }
      });
    });
  }
}

// Singleton instance
export const recommendationEngine = new RFConnector();
