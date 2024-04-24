import { Previewing } from "@/messaging";
import HTTPUtility from "@/util/HTTPUtility";
import { APIEmbed, APIEmbedField } from "discord.js";
import fetch from 'node-fetch';

namespace Deezer
{
	export function CreateTrackEmbed(track: Track): APIEmbed
	{
		return {
			author: {
				name: track.artist.name,
				url: track.artist.link,
				icon_url: track.artist.picture,
			},
			title: `${track.title}`,
			url: track.link,
			description: [
				["Album", `[${track.album.title}](https://deezer.com/album/${track.album.id})`],
				["Duration", `${Previewing.msToHuman(track.duration * 1000)}`],
				["Explicit", `${track.explicit_lyrics ? "Yes" : "No"}`],
				//["User Ranking", `${track.rank}`],
			].map(([key, value]) => `**${key}**: ${value}`).join('\n'),
			thumbnail: { url: track.album.cover },
			//footer: { text: `Results provided by Deezer`, iconURL: IconLinks.Deezer },
			color: 0xc1f1fc,
		}
	}

	export function CreateTrackField(track: Track): APIEmbedField
	{
		return {
			name: `${track.title}`,
			value: `From album [${track.album.title}](https://deezer.com/album/${track.album.id}) by [${track.artist.name}](${track.artist.link}), [Listen on Deezer](${track.link})`,
			inline: false,
		}
	}

	export function Search(query: string, type: "track" = "track"): Promise<SearchResponse>
	{
		if (query.length < 3 || query.length > 100) throw new Error("Query must be between 3 and 100 characters.");
		if (type != "track") throw new Error("Invalid type.");

		const url = 'https://api.deezer.com/search?' + HTTPUtility.ToURLParams({
			'q': query,
		});
		return fetch(url, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			}
		}).then(res => res.json()).then(json => json as SearchResponse);
	}

	export interface SearchResponse {
		data:  Track[];
		total: number;
	}
	
	export interface Track {
		id:                      number;
		readable:                boolean;
		title:                   string;
		title_short:             string;
		title_version:           string;
		link:                    string;
		duration:                number;
		rank:                    number;
		explicit_lyrics:         boolean;
		explicit_content_lyrics: number;
		explicit_content_cover:  number;
		preview:                 string;
		md5_image:               string;
		artist:                  Artist;
		album:                   Album;
		type:                    string;
	}
	
	export interface Album {
		id:           number;
		title:        string;
		cover:        string;
		cover_small:  string;
		cover_medium: string;
		cover_big:    string;
		cover_xl:     string;
		md5_image:    string;
		tracklist:    string;
		type:         string;
	}
	
	export interface Artist {
		id:             number;
		name:           string;
		link:           string;
		picture:        string;
		picture_small:  string;
		picture_medium: string;
		picture_big:    string;
		picture_xl:     string;
		tracklist:      string;
		type:           string;
	}
}

export default Deezer;