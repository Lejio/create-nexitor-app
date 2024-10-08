#!/usr/bin/env node

import prompts from "prompts";
import chalk from "chalk";
import figlet from "figlet";
import cliSpinners from "cli-spinners";
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const onState = (state) => {
    if (state.aborted) {
      process.nextTick(() => {
        console.log(chalk.red('Nexitor aborted!'));
        process.exit(0);
      })
    }
  }

const config_questions = [
    {
        type: "text",
        name: "project_name",
        message: "What's your project name?",
        initial: "app",
        onState: onState,
        validate: (value) => {
            const hasSpacesOrSpecialCharacters = value => /[^a-zA-Z0-9]/.test(value);
            if (hasSpacesOrSpecialCharacters(value)) {
                return "Project name cannot contain spaces or special characters.";
            }
            return true;
        }
    },
    {
        type: "toggle",
        name: "next_config",
        message: "Would you like to configure Next.js?",
        active: "Yes",
        onState: onState,
        inactive: "No",
        format: value => value == true ? true : null,
        initial: false,
    },
    {
        type: prev => prev == true ? "toggle" : null,
        name: "typescript",
        message: `Would you like to use ${chalk.blue.bold('TypeScript')}?`,
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "eslint",
        message: "Would you like to use ESLint?",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "tailwind",
        message: "Would you like to use Tailwind CSS?",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "src_directory",
        message: "Would you like to use `src/` directory?",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "app_router",
        message: "Would you like to use App Router? (recommended)",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "custom_alias",
        message: "Would you like to customize the default import alias (@/*)?",
        initial: false,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    // Needs to add validation for custom_alias
    {
        type: prev => prev == true ? "text" : null,
        name: "alias",
        onState: onState,
        message: "What import alias would you like configured?",
        initial: "@/*",
    },
    {
        type: "toggle",
        name: "capacitor_config",
        message: "Would you like to configure Capacitor?",
        format: value => value == true ? true : null,
        initial: false,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true ? "toggle" : null,
        name: "capacitor_ios",
        message: "Would you like to configure Capacitor for iOS?",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    },
    {
        type: prev => prev == true || prev == false ? "toggle" : null,
        name: "capacitor_android",
        message: "Would you like to configure Capacitor for Android?",
        initial: true,
        onState: onState,
        active: "Yes",
        inactive: "No",
    }
];

// JS Stick Letters
// Doh
// Univers
// Shadow
// Nancyj
// Colossal

const addOutputToNextConfig = () => {
    const configPath = path.join(process.cwd(), 'next.config.mjs');
    console.log(configPath)
    const configFileExists = fs.existsSync(configPath);

    if (configFileExists) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const updatedConfigContent = configContent.replace(
            'const nextConfig = {};',
            'const nextConfig = {\n  output: \'export\',\n};'
        );
        fs.writeFileSync(configPath, updatedConfigContent, 'utf8');
        console.log(chalk.green(`Updated next.config.mjs to include output: 'export'`));
    } else {
        console.log(chalk.red(`next.config.mjs not found at ${configPath}`));
    }
};

const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(chalk.red(`Error: ${stderr}`));
                reject(error);
            } else {
                console.log(stdout)
                resolve(stdout);
            }
        });
    });
};

(async () => {
    await figlet.text(
        "nexitor",
        {
            font: "Univers",
            horizontalLayout: "default",
            verticalLayout: "default",
            width: 80,
            whitespaceBreak: true,
        },
        function (err, data) {
            if (err) {
                console.log("Something went wrong with Figlet...");
                console.dir(err);
                return;
            }
            console.log(chalk.yellow(data));
        }
    )
    const response = await prompts(config_questions);
    console.log(response);
    

    const { project_name, next_config, typescript, eslint, tailwind, src_directory, app_router, custom_alias, capacitor_config, capacitor_ios, capacitor_android } = response;


    // Create Next.js project
    const nextCommand = `npx create-next-app ${project_name} ${next_config ? typescript ? '--typescript' : '--no-typescript'  : '--typescript'} ${ next_config ? eslint ? '--eslint' : '--no-eslint' : '--eslint'} ${next_config ? tailwind ? '--tailwind' : '--no-tailwind' : '--tailwind'} ${next_config ? src_directory ? '--src-dir' : '--no-src-dir' : '--src-dir'} ${ next_config ? app_router ? '--no-app' : '--app' : '--app'} ${ next_config ? custom_alias ? '--no-import-alias' : '--import-alias @/*' : '--import-alias @/*'}`;

    // console.log(nextCommand)
    console.log(`Generating a new nexitor project.`);
    // exec(nextCommand, { stdio: 'inherit' });
    try {
        await runCommand(nextCommand);
        console.log(`Nextjs ${project_name} created successfully.`);
    } catch (error) {
        console.log(chalk.red(`Failed to create project ${project_name}.`));
        process.exit(1);
    }

    process.chdir(project_name);
    addOutputToNextConfig();
    console.log('Creating static build...');
    await runCommand(nextCommand);
    console.log('Installing Capacitor...');
    runCommand('npm install @capacitor/core @capacitor/cli', { stdio: 'inherit' });

    console.log('Initializing Capacitor...');
    await runCommand(`npx cap init ${project_name} com.${project_name.toLowerCase()}.app --web-dir out`, { stdio: 'inherit' });

    if ((capacitor_ios && capacitor_config) || !capacitor_config) {
        console.log('Adding iOS platform...');
        await runCommand('npm i @capacitor/ios', { stdio: 'inherit' });
        await runCommand('npx cap add ios', { stdio: 'inherit' });
    }

    if ((capacitor_android && capacitor_config) || !capacitor_config) {
        console.log('Adding Android platform...');
        await runCommand('npm i @capacitor/android', { stdio: 'inherit' });
        await runCommand('npx cap add android', { stdio: 'inherit' });
    }

    console.log(chalk.green('Project setup complete!'));
    process.exit(0);
})();