import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../typing/Message';
import {FormsModule} from '@angular/forms';

@Component({
	selector: 'message',
	imports: [CommonModule, FormsModule],
	templateUrl: './message.component.html',
	styleUrl: './message.component.less',
})
export class MessageComponent {
	inputName = '';
	inputDescription = '';
	inputEmail = '';

	@Input() message = <Message>{};
	@Output() addItemEvent = new EventEmitter<{ input: string, type: string }>();

	sendName() {
		this.addItemEvent.emit({ input: this.inputName, type: this.message.typeInput ?? '' });
	}

	sendDescription() {
		this.addItemEvent.emit({ input: this.inputDescription, type: this.message.typeInput ?? '' });
	}

	sendEmail() {
		console.log(this.inputEmail)
		this.addItemEvent.emit({ input: this.inputEmail, type: this.message.typeInput ?? '' });
	}
}