'use strict';

var newsCount = 1;

function News( vm, cells, indx ) {
	var self = this,
		checkedCache = ko.observable( false );

	this.title = cells[indx].content.$t;
	this.nid = newsCount++;
	this.tags = cells[indx+1].content.$t;
	this.notes = cells[indx+2].content.$t;
	this.checked = ko.computed({
		read: function() { return this(); },
		write: function( v ) {
			var step = v ? 1 : -1;
			if( v ) {
				vm.curSelected.push( self );
			} else {
				vm.curSelected.remove( self );
			}
			$.each( self.tags, function(i,tag) {
				vm.tags[tag].cur( vm.tags[tag].cur() + step )
			});
			this( v );
		}
	}, checkedCache); 
	this.thisNoteEnabled = ko.observable( false );
	this.noteEnabled = ko.computed( function() {
		return this.thisNoteEnabled();
	}, this);
	this.msg = ko.computed( function() {
		return this.noteEnabled() ? '' : '展開詳細說明';
	}, this);
	this.switchNotes = function( thisNews ) {
		thisNews.thisNoteEnabled( !thisNews.thisNoteEnabled() );
	};

	this.tags = this.tags.replace(/ /g,'').split(',');

	$.each( this.tags, function(i,tag) {
		if( !(tag in vm.tags) ) {
			vm.tags[tag] = { name: tag, cur: ko.observable(0), total: ko.observable(1) };
			vm.tagsList.push( vm.tags[tag] );
		} else {
			vm.tags[tag].total( vm.tags[tag].total()+1 );
		}
	});
}

function newsVM() {
	var self = this;

	this.name = ko.observable('');
	this.email = ko.observable('');
	this.newsList = ko.observableArray();
	this.tags = {};
	this.tagsList = ko.observableArray();
	this.maxSelected = 10;
	this.curSelected = ko.observableArray();
	this.spaceLeave = ko.computed( function() { 
		return self.maxSelected - self.curSelected().length;
	});
	this.nameChecker = ko.computed( function() {
		return self.curSelected().length == 0 || !!self.name();
	});
	this.emailChecker = ko.computed( function() {
		var emailReg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
		return self.curSelected().length == 0 || self.email().match( emailReg );
	});
	this.userInvalid = ko.computed( function() {
		return !self.nameChecker() || !self.emailChecker();
	});
	this.allowSubmit = ko.computed( function() {
		return 	!self.userInvalid() && 
				self.spaceLeave() == 0;
	});
	this.submitText = ko.computed( function() {
		return self.allowSubmit() ? '確定送出' : '無法送出';
	});
	this.prepareSubmit = function() {
		if( self.allowSubmit() ) {
			$('#summary').dialog('open');
			$('#summary .highlight').effect('pulsate', { times: 5 }, 5000);
			$('#summary').scrollTop(0);
		}
	};
	
	this.cancel = function() {
			$('#summary').dialog('close');
	}

	var formUrl = 'http://docs.google.com/forms/d/',
		formKey = '1fAKVvzLFP32DFAaHK-PN94a7cjQsffuoCw0dMIflKmM',
		formTail = '/formResponse',
		submitComplete = false;

	this.submit = function() {
		var selectedNews = [];

		submitComplete = true;
		$('form#submit-form').submit();
		return;
	}

	var feedUrl = 'http://spreadsheets.google.com/feeds/cells',
		feedParas = '/public/basic?alt=json-in-script',
		key='/0AknRKXEZD1LHdE0xajkzaGo2d3VqbVZqU0ZuM0tzNHc',
		parseFeed = function( resp ) {
			var cells = resp.feed.entry,
				totalCells = cells.length - ( cells.length % 3 ),
				indx = 3;

			while( indx < totalCells ) {
				self.newsList.push( new News( self, cells, indx ) );
				indx += 3;
			}
		};

	$.ajax( feedUrl+key+'/1'+feedParas, {
		dataType: 'jsonP',
		success: parseFeed
	});

	$(window).on( 'beforeunload', function() {
		if( !submitComplete ) {
			var msg = '評選尚未送出，您是否確定要離開？';

			if(/Firefox[\/\s](\d+)/.test(navigator.userAgent) && new Number(RegExp.$1) >= 4) {
				if(confirm(msg)) {
					history.go();
				} else {
					window.setTimeout(function() {
						window.stop();
					}, 1);
				}
			} else {
				return msg;
			}
		}
	});
}

$(function() {

	var jqSum = $('#summary-wrapper'),
		jqWin = $(window),
		sumTop = 135,
		debouncer = null;

	jqWin.scroll(function () {
		if( !debouncer ) {

			debouncer = setTimeout( function() {
				if ( jqWin.scrollTop() > sumTop) {
					jqSum.animate( {
							'margin-top': jqWin.scrollTop() - sumTop 
						},
						200
					);
				} else {
					jqSum.css( 'margin-top', 0 );
				}
				debouncer = null;
			}, 200);
		}
	});

	ko.applyBindings( new newsVM() );
	$('input.required').placeholder();

	$('#summary').dialog({
		autoOpen: false,
		dialogClass: 'summary-dia',
		width: 900,
		show: 'slow',
		modal: 'true',
		height: $(window).height() - 160
	});

	Sammy( function() {

		this.get( '#:news', function() {
			$('.p1').hide();
			$('.p2').show();
			window.location.hash = this.params['news'];
		});
		this.get( /.*\/poll/, function() {
			$('.p1').hide();
			$('.p2').show();
			sumTop = jqSum.offset().top;
		});
		this.get('', function() {
			$('.p1').show();
			$('.p2').hide();
		});

	}).run();
});
