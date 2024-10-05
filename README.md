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
6. Created files will be located in ./documentation/your_controller_name/ directory.
7. Paste created files to FiceAdvisor api documentation folder and add imports.

As an example you can already run application and check created test documentation
