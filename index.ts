import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline-sync';

interface DecoratorInfo {
    name: string;
    body: string;
}

function extractResponseDecoratorInfo(input: string): DecoratorInfo | null {
    const decoratorNameRegex = /@Api(\w+)\s*Response/g;
    const decoratorNameMatch = decoratorNameRegex.exec(input);

    if (!decoratorNameMatch) {
        return null;
    }

    const decoratorName = decoratorNameMatch[1].trim();

    const decoratorBodyRegex = /\{([\s\S]*?)}/g;
    const decoratorBodyMatch = decoratorBodyRegex.exec(input);

    if (!decoratorBodyMatch) {
        return null;
    }

    const decoratorBody = decoratorBodyMatch[1].trim();

    return { name: decoratorName, body: decoratorBody };
}

function extractParamDecoratorInfo(input: string): string | null {
    const apiParamRegex = /@ApiParam\(([^)]+)\)/g;
    const apiParamMatch = apiParamRegex.exec(input);

    if (!apiParamMatch) {
        return null;
    }

    return apiParamMatch[1].trim();
}


function generateDocumentationEntry(
    directoryName: string,
    fileName: string,
    responseDecorators: string[],
    paramDecorators: string[]
): string {
    let documentationEntry = `export const ${directoryName}Documentation${fileName[0].toUpperCase() + fileName.slice(1)}: ApiDocumentationParams = {\n`;
    const params: string[] = [];

    responseDecorators.forEach((decorator) => {
        const result = extractResponseDecoratorInfo(decorator);
        if (result) {
            result.body = result.body ? '{\n' + result.body + '\n},\n' : '{}';
            const camelCaseName = result.name[0].toLowerCase() + result.name.slice(1);
            documentationEntry += `${camelCaseName}: ${result.body}`;
        } else {
            console.log("Invalid input format for decorator in file:", fileName);
            console.log('decorator:', decorator);
        }
    });

    paramDecorators.forEach((decorator) => {
        const apiParamBody = extractParamDecoratorInfo(decorator);
        if (apiParamBody) {
            params.push(apiParamBody);
        }
    });

    if (params.length != 0){
        documentationEntry += `params: [\n${params.join(',\n')}\n],\n`;
    }
    documentationEntry += '};';
    return documentationEntry;
}

function getDecorators(file: string): { responseDecorators: string[], paramDecorators:string[] } {
    const fileContent = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    const decoratorRegex = /@Api(\w*)(Response|Param)\(\{[^}]*}\)/g;
    const decorators = fileContent.match(decoratorRegex);
    let responseDecorators: string[] = [];
    let paramDecorators: string[] = [];

    if (!decorators) {
        console.log(`No decorators found in ${file}.`);
    } else {
        responseDecorators = decorators.filter((decorator) => decorator.includes('Response'));
        paramDecorators = decorators.filter((decorator) => decorator.includes('@ApiParam'));
    }

    return {responseDecorators, paramDecorators};
}

const directoryName = readline.question('Enter folder name in src directory:');
const directoryPath = `./src/${directoryName}`;

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err.message);
        return;
    }

    files.forEach((file) => {
        const fileNameWithoutExtension = path.parse(file).name;
        const {responseDecorators, paramDecorators} = getDecorators(file);
        const documentationEntry = generateDocumentationEntry(
            directoryName,
            fileNameWithoutExtension,
            responseDecorators,
            paramDecorators
        );

        const documentationDirectory = `./documentation/${directoryName}`;
        if (!fs.existsSync(documentationDirectory)){
            fs.mkdirSync(documentationDirectory);
        }
        fs.writeFileSync(`${documentationDirectory}/${fileNameWithoutExtension}.ts`, documentationEntry);
    });
});