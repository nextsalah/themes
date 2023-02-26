import { isTemplatesType, iscustomTemplatesType, isconfigType } from '../interfaces/types';
import type * as types from '../interfaces/types';
import fs from 'fs';
import path from 'path';

class Theme {
	folderName: string;
	config: types.configType;
	themeTemplates: types.templatesType;

	private constructor(
		themeFolderName: string,
		config: types.configType,
		themeTemplates: types.templatesType,
	) {
		this.folderName = themeFolderName;
		this.config = config;
		this.themeTemplates = themeTemplates;
	}

	get folderPath() {
		return path.resolve(path.join('themes', 'theme_files', this.folderName));
	}

	parseCustomTemplates(customTemplatesInput: string) : types.customTemplatesType | Error {
		/**
		 * It takes a string and parses it into a customTemplatesType.
		 * @param {string} customTemplatesInput - string - The string that you want to parse.
		 * @returns A function that takes a string and returns either a customTemplatesType or an Error.
		 */
		const customTemplates = Theme.safeJsonParse(iscustomTemplatesType)(customTemplatesInput);

		if (customTemplates.hasError) {
			return new Error('Failed to parse custom templates');
		}
		return customTemplates.parsed;
	}

	get getDefault(): types.defaultTemplatesType {
		let defaultTemplates: types.defaultTemplatesType = {};
		for (const setting of this.themeTemplates) {
			if (setting.value == null){ continue;}
			defaultTemplates[setting.name] = setting.value;
		}
		return defaultTemplates;
	};


	static safeJsonParse =
		<T>(guard: (o: any) => o is T) =>
		(text: string): types.ParseResult<T> => {
			try {
				const parsed = JSON.parse(text);
				return guard(parsed) ? { parsed, hasError: false } : { hasError: true };
			} catch (error) {
				return { hasError: true };
			}
		};

	static readFile(folder: string, file: string): string | Error{
		try{
			return fs.readFileSync(path.resolve(path.join('themes', 'theme_files', folder), file), 'utf8');
		}
		catch (error) {
			 return new Error('Failed to read file: ' + folder + '/' + file);
		}
	}

	static getConfig(folder_name: string) : types.ParseResult<types.configType> {
		const config = Theme.readFile(folder_name, 'config.json');
		if (config instanceof Error) {
			return { hasError: true, error: config.message } as types.ParseResult<any>;
		}
		return Theme.safeJsonParse(isconfigType)(config);
	}
	static getTemplate(folder_name: string): types.ParseResult<types.templatesType>{
		const templates = Theme.readFile(folder_name, 'template.json');
		if (templates instanceof Error) {
			return { hasError: true, error: templates.message }  as types.ParseResult<any>;
		}
		return Theme.safeJsonParse(isTemplatesType)(templates);
	}

	static async getAllAvailableThemes(): Promise<string[]> {
		const themes = fs.readdirSync(path.resolve(path.join('themes', 'theme_files')));
		return themes;
	}

	// COnvert this into type 
	static async AllThemes():  Promise<types.allThemesType[]> {
		const availableThemes = await Theme.getAllAvailableThemes();
		let allThemes: types.allThemesType[] = [];
		for (const theme of availableThemes) {
			const config = this.getConfig(theme);
			if (config.hasError) {
				continue;
			}
			allThemes.push({ value: theme, name: config.parsed.name });
		}
		return allThemes;
	}


	static async isValidTheme(themeFolderName: string): Promise<boolean> {
		const availableThemes = await Theme.getAllAvailableThemes();
		return availableThemes.includes(themeFolderName);
	}

	static async create(
		themeFolderName: string,
	): Promise<Theme | Error> {
		if (!(await Theme.isValidTheme(themeFolderName))) {
			return new Error('Theme not found with name '+ themeFolderName );
		}

		const config = this.getConfig(themeFolderName);
		const themeTemplates = this.getTemplate(themeFolderName);

		if (config.hasError) {
			return new Error(config.error as string || 'Failed to parse theme config');
		}

		if (themeTemplates.hasError) {
			return new Error( themeTemplates.error as string || 'Failed to parse theme templates');
		}

		return new Theme(themeFolderName, config.parsed, themeTemplates.parsed);
	}
}

export default Theme;
