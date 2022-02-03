export class BetterDialog extends Dialog {
	submit(button) {
		try {
			if (button.callback) if (button.callback(this.options.jQuery ? this.element : this.element[0]) == false ?? false) return false;
			this.close();
		} catch(err) {
			ui.notifications.error(err);
			throw new Error(err);
		}
	}
}