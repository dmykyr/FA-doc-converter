import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline-sync';

interface DecoratorInfo {
    name: string;
    body: string;
}

interface Decorators {
    responseDecorators: RegExpMatchArray | null,
    paramDecorators: RegExpMatchArray | null,
    queryDecorators: RegExpMatchArray | null,
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

function extractQueryOrParamDecoratorInfo(input: string): string | null {
    const regex = /@Api(Query|Param)\(([^)]+)\)/g;
    const match = regex.exec(input);

    if (!match) {
        return null;
    }
    return match[2].trim();
}


function generateDocumentationEntry(
    directoryName: string,
    fileName: string,
    decorators: Decorators,
    isAuth: boolean,
): string {
    let documentationEntry = `export const ${directoryName}Documentation${fileName[0].toUpperCase() + fileName.slice(1)}: ApiDocumentationParams = {\n`;

    if (isAuth){
        documentationEntry += 'isAuth: true,\n'
    }
    decorators.responseDecorators?.forEach((decorator) => {
        const result = extractResponseDecoratorInfo(decorator);
        if (result) {
            result.body = result.body ? '{\n' + result.body + '\n},\n' : '{}';
            const camelCaseName = result.name[0].toLowerCase() + result.name.slice(1);
            documentationEntry += `${camelCaseName}: ${result.body}`;
        }
    });
    const processDecorators = (decoratorType: string, decorators: RegExpMatchArray | null) => {
        const bodies: string[] = []
        decorators?.forEach((decorator) => {
            const body = extractQueryOrParamDecoratorInfo(decorator);
            if (body) {
                bodies.push(body);
            }
        });
        documentationEntry += `${decoratorType}: [\n${bodies.join(',\n')}\n],\n`;
    };

    processDecorators('params', decorators.paramDecorators);
    processDecorators('queries', decorators.queryDecorators);

    documentationEntry += '};';
    return documentationEntry;
}

function getDecorators(fileContent: string): Decorators | undefined {
    const responseDecoratorRegex = /@Api(\w+)(Response)\(\{[^}]*}\)/g;
    const paramDecoratorRegex = /(@ApiParam)\(\{[^}]*}\)/g;
    const queryDecoratorRegex = /(@ApiQuery)\(\{[^}]*}\)/g;

    const responseDecorators = fileContent.match(responseDecoratorRegex);
    const paramDecorators = fileContent.match(paramDecoratorRegex);
    const queryDecorators = fileContent.match(queryDecoratorRegex);

    if (!responseDecorators && !paramDecorators && !queryDecorators) {
        console.log(`No decorators found in ${fileContent}.`);
        return;
    }
    return {responseDecorators, paramDecorators, queryDecorators};
}

const directoryName = readline.question('Enter folder name in src directory:');
const directoryPath = `./src/${directoryName}`;

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err.message);
        return;
    }

    files.forEach((file) => {
        const fileContent = fs.readFileSync(path.join(directoryPath, file), 'utf8');

        const fileNameWithoutExtension = path.parse(file).name;
        const decorators = getDecorators(fileContent);
        const isAuth = fileContent.includes('@ApiCookieAuth()');
        if(!decorators) return;

        const documentationEntry = generateDocumentationEntry(
            directoryName,
            fileNameWithoutExtension,
            decorators,
            isAuth
        );

        const documentationDirectory = `./documentation/${directoryName}`;
        if (!fs.existsSync(documentationDirectory)){
            fs.mkdirSync(documentationDirectory);
        }
        fs.writeFileSync(`${documentationDirectory}/${fileNameWithoutExtension}.ts`, documentationEntry);
    });
});