import { promises as fs } from 'fs';

// lee un archivo JSON y lo devuelve como un objeto JavaScript de forma asincrónica
export const readJSON = async (path) => {
  try {
    const data = await fs.readFile(path, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error al leer el archivo JSON: ${error}`);
    throw error;
  }
};

// crear un archivo JSON con un objeto JavaScript de forma asincrónica
export const writeJSON = async (path, data) => {
  try {
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error al escribir el archivo JSON: ${error}`);
    throw error;
  }
};
