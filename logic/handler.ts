import { isSettingsType, iscustomSettingsType, isconfigType } from '../interfaces/types';
import type * as types from '../interfaces/types';
import fs from 'fs';
import path from 'path';

class Theme {
	folderName: string;
	config: types.configType;
	themeSettings: types.settingsType;

	private constructor(
		themeFolderName: string,
		config: types.configType,
		themeSettings: types.settingsType,
	) {
		this.folderName = themeFolderName;
		this.config = config;
		this.themeSettings = themeSettings;
	}

	get folderPath() {
		return path.resolve(path.join('themes', 'theme_files', this.folderName));
	}

	parseCustomSettings(customSettingsInput: string) : types.customSettingsType | Error {
		const customSettings = Theme.safeJsonParse(iscustomSettingsType)(customSettingsInput);

		if (customSettings.hasError) {
			return new Error('Failed to parse custom settings');
		}
		return customSettings.parsed;
	}
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
	static getSettings(folder_name: string): types.ParseResult<types.settingsType>{
		// TODO: add guard
		const settings = Theme.readFile(folder_name, 'settings.json');
		if (settings instanceof Error) {
			return { hasError: true, error: settings.message }  as types.ParseResult<any>;
		}
		return Theme.safeJsonParse(isSettingsType)(settings);
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
		const themeSettings = this.getSettings(themeFolderName);

		if (config.hasError) {
			return new Error(config.error as string || 'Failed to parse theme config');
		}

		if (themeSettings.hasError) {
			return new Error( themeSettings.error as string || 'Failed to parse theme settings');
		}

		return new Theme(themeFolderName, config.parsed, themeSettings.parsed);
	}
}

export default Theme;
