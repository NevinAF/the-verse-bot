import { drive_v3 } from "googleapis";
import { GoogleClient } from "./GoogleClient";

export namespace GoogleDrive
{
	export async function GetFiles(params: drive_v3.Params$Resource$Files$List):
		Promise<drive_v3.Schema$File[] | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;
		
		const files = await GoogleClient.DriveClient.files.list(params);
		return files?.data?.files ?? null;
	}

	export async function GetFile(params: drive_v3.Params$Resource$Files$Get):
		Promise<drive_v3.Schema$File | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		const file = await GoogleClient.DriveClient.files.get(params);
		return file?.data ?? null;
	}

	export async function CreateFile(params: drive_v3.Params$Resource$Files$Create):
		Promise<drive_v3.Schema$File | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		const file = await GoogleClient.DriveClient.files.create(params);
		return file?.data ?? null;
	}

	export async function UpdateFile(params: drive_v3.Params$Resource$Files$Update):
		Promise<drive_v3.Schema$File | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		const file = await GoogleClient.DriveClient.files.update(params);
		return file?.data ?? null;
	}

	export async function DeleteFile(params: drive_v3.Params$Resource$Files$Delete):
		Promise<void>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		await GoogleClient.DriveClient.files.delete(params);
	}

	export async function GetFilePermissions(params: drive_v3.Params$Resource$Permissions$List):
		Promise<drive_v3.Schema$Permission[] | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		const permissions = await GoogleClient.DriveClient.permissions.list(params);
		return permissions?.data?.permissions ?? null;
	}

	export async function CreateFilePermission(params: drive_v3.Params$Resource$Permissions$Create):
		Promise<drive_v3.Schema$Permission | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		const permission = await GoogleClient.DriveClient.permissions.create(params);
		return permission?.data ?? null;
	}

	export async function DeleteFilePermission(params: drive_v3.Params$Resource$Permissions$Delete):
		Promise<void>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;

		await GoogleClient.DriveClient.permissions.delete(params);
	}
}