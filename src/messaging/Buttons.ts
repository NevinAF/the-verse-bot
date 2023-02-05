import { APIActionRowComponent, APIMessageActionRowComponent, ComponentType, APIButtonComponent } from "discord.js";

type ActionRowData = APIActionRowComponent<APIMessageActionRowComponent>

namespace Buttons
{
	export function bestActionRowLength(numberOfButtons: number): number
	{
		return (numberOfButtons <= 3) ? 5 :
			(numberOfButtons == 4) ? 2 :
			(numberOfButtons <= 6) ? 3 :
			(numberOfButtons <= 8) ? 4 :
			(numberOfButtons == 10) ? 5 :
			(numberOfButtons <= 12) ? 4 :
			(numberOfButtons <= 15) ? 5 :
			(numberOfButtons == 16) ? 4 :
			5;
	}

	export function toActionRow(btn: APIButtonComponent): ActionRowData
	{
		return {
			type: ComponentType.ActionRow,
			components: [btn]
		}
	}

	export function toNiceActionRows(btns: APIButtonComponent[]): ActionRowData[]
	{
		const rows: ActionRowData[] = [];
		const rowLength = bestActionRowLength(btns.length);
		for (let i = 0; i < btns.length; i += rowLength)
		{
			rows.push({
				type: ComponentType.ActionRow,
				components: btns.slice(i, i + rowLength)
			});
		}
		return rows;
	}

	export const staticIds = {
		NullCall: "null call",
		NotImplemented: "not implemented",
	};
}

export default Buttons;