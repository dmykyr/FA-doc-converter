# Documentation converter for [FiceAdvisor api](https://github.com/fictadvisor/fictadvisor)

## Prerequisites

* yarn `npm i -g yarn`

## Installation

1. Clone the repository
   ```sh
   git clone https://github.com/dmykyr/FA-doc-converter.git
   ```
2. Install npm packages
   ```sh
   yarn install
   ```

## Usage

1. Navigate to the project src directory
2. Add directory with controller name (should start with capital letter)
3. Create files with name of controller's methods
4. Move decorators from methods to corresponding files
5. Run the application:
   ```sh
   yarn start
   ```
6. Enter necessary directory name to parse in console dialog
7. Created files will be located in ./documentation/your_controller_name/ directory.
8. Paste created files to FiceAdvisor api documentation folder and add imports.

## Work example <br>

src/Cat/config.txt file:
```ts
@ApiCookieAuth()
@ApiOkResponse({
   type: string,
})
@ApiBadRequestResponse({
   description: `\n
   InvalidEntityIdException:
     Entity with such id is not found`,
})
@ApiUnauthorizedResponse({
   description: `\n
   UnauthorizedException:
     Unauthorized`,
})
@ApiForbiddenResponse({
   description: `\n
   NoPermissionException:
     You do not have permission to perform this action`,
})
@ApiParam({
   name: 'firstParamName',
   required: true,
   description: 'this param go first',
})
@ApiParam({
   name: 'second param',
   required: false,
})
@ApiQuery({
   name: 'query 1',
   enum: ['param', 'param'],
})
@ApiQuery({
   name: 'second query',
   enum: [1, 2],
   description: 'Semester number',
})
```

created documentation/Cat/config.ts file:
```ts
export const CatDocumentationConfig: ApiDocumentationParams = {
isAuth: true,
ok: {
type: string,
},
badRequest: {
description: `\n
    InvalidEntityIdException:
      Entity with such id is not found`,
},
unauthorized: {
description: `\n
    UnauthorizedException:
      Unauthorized`,
},
forbidden: {
description: `\n
    NoPermissionException:
      You do not have permission to perform this action`,
},
params: [
{
    name: 'firstParamName',
    required: true,
    description: 'this param go first',
  },
{
    name: 'second param',
    required: false,
  }
],
queries: [
{
    name: 'query 1',
    enum: ['param', 'param'],
  },
{
    name: 'second query',
    enum: [1, 2],
    description: 'Semester number',
  }
],
};
```