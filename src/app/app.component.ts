import { Component, Output, EventEmitter, ApplicationConfig, inject, Injectable, model } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageComponent } from './message/message.component';
import { Message } from '../typing/Message';
import { provideHttpClient } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import OpenAI from "openai";
import texts from './text.config.json';

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient()
	]
};

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, MessageComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.less',

})

@Injectable({ providedIn: 'root' })
export class AppComponent {
	http: HttpClient = inject(HttpClient);
	// constructor() {}
	// var http = HttpClient;
	@Output() addItemEvent = new EventEmitter<string>();

	public banner = "logoProjet.png"
	public messages: Message[] = [];

	async handleAddItem(data: { input: string, type: string }) {
		switch (data.type) {
			case 'name':
				this.messages.pop();
				this.messages.push({
					text: data.input,
					me: false
				});
				this.messages.push({
					text: 'enchanté ' + data.input + '!',
					me: true
				});
				setTimeout(() => {
					console.log('AppComponent is ready');
					this.messages.push({
						text: 'Pouvez vous me dire en quoi je peux vous aider?',
						me: true
					});

				}, 200);
				setTimeout(() => {
					this.messages.push({
						text: 'Nom:',
						me: false,
						input: true,
						typeInput: 'description',
					});
				}, 500);
				break;
			case 'description':
				this.messages.pop();
				this.messages.push({
					text: data.input,
					me: false,
				});

				// var body = {
				// 	messages: {role: 'user', content: data.input},
				// 	model: 'gpt-3.5-turbo',
				// }
				// let options = {
				// 	headers: {
				// 		'Content-Type': 'application/json',
				// 		'Authorization': 'Bearer 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'
				// 	}
				// }

				// this.http.post(' https://api.openai.com/v1/chat/completions', body, options).subscribe((data: any) => {
				// 	console.log(data);
				// });
				// const openai = new OpenAI({apiKey:"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", dangerouslyAllowBrowser: true});
				// const completion = await openai.chat.completions.create({
				// 	model: "gpt-4o-mini",
				// 	messages: [
				// 		{ role: "system", content: "You are a helpful assistant." },
				// 		{
				// 			role: "user",
				// 			content: "Write a haiku about recursion in programming.",
				// 		},
				// 	],
				// 	store: true,
				// });
				// console.log(completion);
				this.messages.push({
					text: 'Merci pour votre message, Chatgpt.',
					me: true
				});
				setTimeout(() => {
					this.messages.push({
						text: 'je vous recontact tres vite par email:',
						me: true,
					});
					this.messages.push({
						text: 'Email:',
						me: false,
						input: true,
						typeInput: 'email',
					});
				}, 1000);

				break;
			case 'email':
				this.messages.pop();
				this.messages.push({
					text: data.input,
					me: false,
				});
				this.messages.push({
					text: 'Merci pour votre email, je vous recontacte tres vite.',
					me: false,
				});
				break
		}
	};

	ngOnInit() {
		setTimeout(() => {
			console.log('AppComponent is ready');
			this.messages.push({
				text: texts.hello,
				me: true
			});
		}, 200);
		setTimeout(() => {
			this.messages.push({
				text: texts.name,
				me: true,
			});
			this.messages.push({
				text: 'Nom:',
				me: false,
				input: true,
				typeInput: 'name',
			});
		}, 500);
	}
}