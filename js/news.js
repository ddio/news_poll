'use strict';

function newsVM() {
	var self = this;
	this.newsList = ko.observableArray();
}

$(function() {

	ko.applyBindings( new newsVM() );
	$('input.required').placeholder();
	$('#news-form').validate();
});
