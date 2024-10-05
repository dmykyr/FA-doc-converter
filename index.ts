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

interface IndexConstant {
    name: string,
    value: string,
    import: string,
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
    documentationConstantName: string,
    decorators: Decorators,
    isAuth: boolean,
): string {
    let documentationEntry = `export const ${documentationConstantName}: ApiDocumentationParams = {\n`;

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
        if (bodies.length != 0){
            documentationEntry += `${decoratorType}: [\n${bodies.join(',\n')},\n],\n`;
        }
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
function camelToSnakeCase(input: string): string {
    return input.replace(/([A-Z])/g, '_$1').toUpperCase();
}


const directoryName = readline.question('Enter folder name in src directory:');
const directoryPath = `./src/${directoryName}`;

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err.message);
        return;
    }

    const documentationDirectory = `./documentation/${directoryName}`;
    const indexFileConsts: IndexConstant[] = [];

    files.forEach((file) => {
        const fileNameWithoutExtension = path.parse(file).name;
        const startCaseFileName = fileNameWithoutExtension[0].toUpperCase() + fileNameWithoutExtension.slice(1);
        const documentationConstantName = `${directoryName}Documentation${startCaseFileName}`;

        const fileContent = fs.readFileSync(path.join(directoryPath, file), 'utf8');
        const decorators = getDecorators(fileContent);
        const isAuth = fileContent.includes('@ApiCookieAuth()');
        if(!decorators) return;

        const documentationEntry = generateDocumentationEntry(
            documentationConstantName,
            decorators,
            isAuth
        );

        if (!fs.existsSync(documentationDirectory)){
            fs.mkdirSync(documentationDirectory);
        }
        fs.writeFileSync(`${documentationDirectory}/${fileNameWithoutExtension}.ts`, documentationEntry);


        indexFileConsts.push({
            name: camelToSnakeCase(fileNameWithoutExtension),
            value: documentationConstantName,
            import: `import { ${documentationConstantName} } from './${fileNameWithoutExtension}';`
        });
    });

    let indexFile = `\nexport const ${directoryName}Documentation = {\n`
    for (const indexFileConst of indexFileConsts) {
        indexFile = indexFileConst.import + '\n' + indexFile + `${indexFileConst.name}: ${indexFileConst.value},\n`
    }
    indexFile += '};'
    fs.writeFileSync(`${documentationDirectory}/index.ts`, indexFile);
});