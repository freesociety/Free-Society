
/* Tabs */
jQuery.fn.tabs = function(settings){
	//configurable options
	var o = $.extend({
		updateHash: false,
		alwaysScrollToTop: true
	},settings);
	
	return $(this).each(function(){
		//reference to tabs container
		var tabs = $(this);

		//maybe set ARIA app mode depending on use case
		/*
		if( !$('body').is('[role]') ){ 
			$('body').attr('role','application');
		}
		*/
		
		//nav is first ul
		var tabsNav = tabs.find('ul:first');
		
		//body is nav's next sibling
		var tabsBody = $(tabsNav.find('a:eq(0)').attr('href')).parent();
		
		var tabIDprefix = 'tab-';

		var tabIDsuffix = '-enhanced';
		
		//add class to nav, tab body
		tabsNav
			.addClass('tabs-nav')
			.attr('role','tablist');
			
		tabsBody
			.addClass('tabs-body');
		
		//find tab panels, add class and aria
		tabsBody.find('>div').each(function(){
			$(this)
				.addClass('tabs-panel')
				.attr('role','tabpanel')
				.attr('aria-hidden', true)
				.attr('aria-labelledby', tabIDprefix + $(this).attr('id'))
				.attr('id', $(this).attr('id') + tabIDsuffix);
		});
		
		//set role of each tab
		tabsNav.find('li').each(function(){
			$(this)
				.attr('role','tab')
				.attr('id', tabIDprefix+$(this).find('a').attr('href').split('#')[1]);
		});

		//switch selected on click
		tabsNav.find('a').attr('tabindex','-1');
		
		//generic select tab function
		function selectTab(tab,fromHashChange){	
				//unselect tabs
				tabsNav.find('li.tabs-selected')
					.removeClass('tabs-selected')
					.find('a')
						.attr('tabindex','-1');
				//set selected tab item	
				tab
					.attr('tabindex','0')
					.parent()
						.addClass('tabs-selected')
						.find("a")
						.focus();
				//unselect  panels
				tabsBody.find('div.tabs-panel-selected').attr('aria-hidden',true).removeClass('tabs-panel-selected');
				//select active panel
				$( tab.attr('href') + tabIDsuffix ).addClass('tabs-panel-selected').attr('aria-hidden',false);
				
				//update hash if option is true
				if( o.updateHash ){
					location.hash = tab.attr('href');
				}
		};			
	
		tabsNav.find('a')
			.click(function( e ){
				selectTab($(this));
				e.preventDefault();
			})
			.keydown(function(event){
				var currentTab = $(this).parent();
				var ret = true;
				switch(event.keyCode){
					case 37://left
					case 38://up
						if(currentTab.prev().size() > 0){
							selectTab(currentTab.prev().find('a'));
							currentTab.prev().find('a').eq(0).focus();
							ret = false;
						}
					break;
					case 39: //right
					case 40://down
						if(currentTab.next().size() > 0){
							selectTab(currentTab.next().find('a'));
							currentTab.next().find('a').eq(0).focus();
							ret = false;
						}
					break;
					case 36: //home key
						selectTab(tabsNav.find('li:first a'));
						tabsNav.find('li:first a').eq(0).focus();
						ret = false;
					break;
					case 35://end key
						selectTab(tabsNav.find('li:last a'));
						tabsNav.find('li:last a').eq(0).focus();
						ret = false;
					break;
				}
				return ret;
			});
			
		//function to select a tab from the url hash
		function selectTabFromHash(hash){
			var currHash = hash || window.location.hash;
			var hashedTab = tabsNav.find('a[href=#'+ currHash.replace('#','') +']');
		    if( hashedTab.size() > 0){
		    	selectTab(hashedTab,true);	
		    }
		    else {
		    	selectTab( tabsNav.find('a:first'),true);
		    }
		    //return true/false
		    return !!hashedTab.size();
		}
		
		//set tab from hash at page load, if no tab hash, select first tab
		selectTabFromHash(null,true);
		
		//support hashchange event if available for backbutton, history, etc
		if( o.updateHash ){
			$(window).bind("hashchange", function(){
				var newHash = location.hash;
				selectTabFromHash(newHash,true);
				
			});
		}
		
		if(o.alwaysScrollToTop){
			$(window)[0].scrollTo(0,0);
		}
	});
};	

/* Category tree */
$.fn.tree = function(settings){
	var o = $.extend({
		expanded: ''
	},settings);
	
	return $(this).each(function(){
		if( !$(this).parents('.tree').length ){
		//save reference to tree UL
		var tree = $(this);
		
		//add the role and default state attributes
		if( !$('body').is('[role]') ){ $('body').attr('role','application'); }
		//add role and class of tree
		tree.attr({'role': 'tree'}).addClass('tree');
		//set first node's tabindex to 0
		tree.find('a:eq(0)').attr('tabindex','0');
		//set all others to -1
		tree.find('a:gt(0)').attr('tabindex','-1');
		//add group role and tree-group-collapsed class to all ul children
		tree.find('ul').attr('role','group').addClass('tree-group-collapsed');
		//add treeitem role to all li children
		tree.find('li').attr('role','treeitem');
		//find tree group parents
		tree.find('li:has(ul)')
				.attr('aria-expanded', 'false')
				.find('>a')
				.addClass('tree-parent tree-parent-collapsed');
	
		//expanded at load		
		tree
			.find(o.expanded)
			.attr('aria-expanded', 'true')
				.find('>a')
				.removeClass('tree-parent-collapsed')
				.next()
				.removeClass('tree-group-collapsed');
						
		//bind the custom events
		tree
			//expand a tree node
			.bind('expand',function(event){
				var target = $(event.target) || tree.find('a[tabindex=0]');
				target.removeClass('tree-parent-collapsed');
				target.next().hide().removeClass('tree-group-collapsed').slideDown(150, function(){
					$(this).removeAttr('style');
					target.parent().attr('aria-expanded', 'true');
				});
			})
			//collapse a tree node
			.bind('collapse',function(event){
				var target = $(event.target) || tree.find('a[tabindex=0]');
				target.addClass('tree-parent-collapsed');
				target.next().slideUp(150, function(){
					target.parent().attr('aria-expanded', 'false');
					$(this).addClass('tree-group-collapsed').removeAttr('style');
				});
			})
			.bind('toggle',function(event){
				var target = $(event.target) || tree.find('a[tabindex=0]');
				//check if target parent LI is collapsed
				if( target.parent().is('[aria-expanded=false]') ){ 
					//call expand function on the target
					target.trigger('expand');
				}
				//otherwise, parent must be expanded
				else{ 
					//collapse the target
					target.trigger('collapse');
				}
			})
			//shift focus down one item		
			.bind('traverseDown',function(event){
				var target = $(event.target) || tree.find('a[tabindex=0]');
				var targetLi = target.parent();
				if(targetLi.is('[aria-expanded=true]')){
					target.next().find('a').eq(0).focus();
				}
				else if(targetLi.next().length) {
					targetLi.next().find('a').eq(0).focus();
				}	
				else {				
					targetLi.parents('li').next().find('a').eq(0).focus();
				}
			})
			//shift focus up one item
			.bind('traverseUp',function(event){
				var target = $(event.target) || tree.find('a[tabindex=0]');
				var targetLi = target.parent();
				if(targetLi.prev().length){ 
					if( targetLi.prev().is('[aria-expanded=true]') ){
						targetLi.prev().find('li:visible:last a').eq(0).focus();
					}
					else{
						targetLi.prev().find('a').eq(0).focus();
					}
				}
				else { 				
					targetLi.parents('li:eq(0)').find('a').eq(0).focus();
				}
			});
		
		//and now for the native events
		tree	
			.focus(function(event){
				//deactivate previously active tree node, if one exists
				tree.find('[tabindex=0]').attr('tabindex','-1').removeClass('tree-item-active');
				//assign 0 tabindex to focused item
				$(event.target).attr('tabindex','0').addClass('tree-item-active');
			})
			.click(function(event){
				//save reference to event target
				var target = $(event.target);
				//check if target is a tree node
				if( target.is('a.tree-parent') ){
					target.trigger('toggle');
					target.eq(0).focus();
					//return click event false because it's a tree node (folder)
					return false;
				}
			})

		}
	});
};	

/* Responsive Table */
;(function($){
		
	var __loop = function( cfg, i ) {
		
		var $this 	= $(this),
			wdg 	= $this.data( 'MediaTable' );
		
		// Prevent re-initialization of the widget!
		if ( !$.isEmptyObject(wdg) ) return;
		
		// Build the widget context.
		wdg = {
			$wrap:		$('<div>'),		// Refer to the main content of the widget
			$table:		$this,			// Refer to the MediaTable DOM (TABLE TAG)
			$menu:		false,			// Refer to the column's toggler menu container
			cfg:		cfg,			// widget local configuration object
			id:			$this.attr('id')
		};
		
		// Setup Widget ID if not specified into DOM Table.
		if ( !wdg.id ) {
			wdg.id = 'MediaTable-' + i;
			wdg.$table.attr( 'id', wdg.id );
		}
		
		// Activate the MediaTable.
		wdg.$table.addClass('activeMediaTable');
		
		// Create the wrapper.
		wdg.$wrap.addClass('mediaTableWrapper');
		
		// Place the wrapper near the table and fill with MediaTable.
		wdg.$table.before(wdg.$wrap).appendTo(wdg.$wrap);
		
		// Menu initialization logic.
		if ( wdg.cfg.menu ) __initMenu( wdg );
		
		// Columns Initialization Loop.
		wdg.$table.find('thead th').each(function(i){	__thInit.call( this, i, wdg );	});
		
		// Save widget context into table DOM.
		wdg.$table.data( 'MediaTable', wdg );
		
	}; // EndOf: "__loop()" ###
	
		var __initMenu = function( wdg ) {
			
			// Buid menu objects
			wdg.$menu 			= $('<div />');
			wdg.$menu.$header 	= $('<a />');
			wdg.$menu.$list		= $('<ul />');
			
			// Setup menu general properties and append to DOM.
			wdg.$menu
				.addClass('mediaTableMenu')
				.addClass('mediaTableMenuClosed')
				.append(wdg.$menu.$header)
				.append(wdg.$menu.$list);
			
			// Add a class to the wrapper to inform about menu presence.
			wdg.$wrap.addClass('mediaTableWrapperWithMenu');
			
			// Setup menu title (handler)
			wdg.$menu.$header.text(wdg.cfg.menuTitle);
			wdg.$table.before(wdg.$menu);
			
			// Bind screen change events to update checkbox status of displayed fields.
			$(window).bind('orientationchange resize',function(){
				wdg.$menu.find('input').trigger('updateCheck');
			});
			
			// Toggle list visibility when clicking the menu title.
			wdg.$menu.$header.bind('click',function(){
				wdg.$menu.toggleClass('mediaTableMenuClosed');
			});
			
			wdg.$table.click(function() {
                wdg.$menu.addClass('mediaTableMenuClosed');
            });
			
			// Toggle list visibilty when mouse go outside the list itself.
			wdg.$menu.$list.bind('mouseleave',function(e){
				wdg.$menu.toggleClass('mediaTableMenuClosed');
				e.stopPropagation();
			});
			
		}; // EndOf: "__initMenu()" ###
		
		var __thInit = function( i, wdg ) {
			
			var $th 	= $(this),
				id		= $th.attr('id'),
				classes = $th.attr('class');
			
			// Set up an auto-generated ID for the column.
			// the ID is based upon widget's ID to allow multiple tables into one page.
			if ( !id ) {
				id = wdg.id + '-mediaTableCol-' + i;
				$th.attr( 'id', id );
			}
			
			// Add toggle link to the menu.
			if ( wdg.cfg.menu && !$th.is('.persist') ) {
				
				var $li = $('<li><input type="checkbox" name="toggle-cols" id="toggle-col-'+wdg.id+'-'+i+'" value="'+id+'" /><span></span> <label for="toggle-col-'+wdg.id+'-'+i+'">'+$th.text()+'</label></li>');
				wdg.$menu.$list.append($li);
				
				__liInitActions( $th, $li.find('input'), wdg );
				
			}
			
			// Propagate column's properties to each cell.
			$('tbody tr',wdg.$table).each(function(){	__trInit.call( this, i, id, classes ); });
			
		}; // EndOf: "__thInit()" ###
		
		var __trInit = function( i, id, classes ) {
			
			var $cell	= $(this).find('td,th').eq(i);
			
			$cell.attr( 'headers', id );
			
			if ( classes ) $cell.addClass(classes);
			
		}; // EndOf: "__trInit()" ###
			
		var __liInitActions = function( $th, $checkbox, wdg ) {
			
			var change = function() {
				
				var	val 	= $checkbox.val(),  // this equals the header's ID, i.e. "company"
					cols 	= wdg.$table.find("#" + val + ", [headers="+ val +"]"); // so we can easily find the matching header (id="company") and cells (headers="company")
				
				
				if ( $checkbox.is(":checked")) { 
					cols.show();
					 
				} else { 
					cols.hide();
					
				};
				
			};
			
			var updateCheck = function() {
				
				//if ( $th.css("display") ==  "table-cell") {
				if ( $th.is(':visible') ) {
					$checkbox.attr("checked", true);
				}
				else {
					$checkbox.attr("checked", false);
				};
			
			};
			
			$checkbox
				.bind('change',	change )
				.bind('updateCheck', updateCheck )
				.trigger( 'updateCheck' );
		
		} // EndOf: "__liInitActions()" ###
	
	$.fn.mediaTable = function() {
		
		var cfg = false;
		
		// Default configuration block
		if ( !arguments.length || $.isPlainObject(arguments[0]) ) cfg = $.extend({},{
			
			// Teach the widget to create a toggle menu to declare column's visibility
			menu:		true,
			menuTitle:	'Columns',
			
		t:'e'},arguments[0]);
		// -- default configuration block --
		
		// Items initialization loop:	
		if ( cfg !== false ) {
			$(this).each(function( i ){ __loop.call( this, cfg, i ); });
 			
		// Item actions loop - switch throught actions
		} else if ( arguments.length ) switch ( arguments[0] ) {
		
			case 'destroy':
			$(this).each(function(){ __destroy.call( this ); });
			break;
		
		}
		
		return this;
		
	}; // EndOf: "$.fn.mediaTable()" ###
	
	
})( jQuery );


/* Modal Windows */
(function($) {
$.fn.jqm=function(o){
var p={
overlay: 50,
overlayClass: 'jqmOverlay',
closeClass: 'jqmClose',
trigger: '.jqModal',
ajax: F,
ajaxText: '',
target: F,
modal: F,
toTop: F,
onShow: F,
onHide: F,
onLoad: F
};
return this.each(function(){if(this._jqm)return H[this._jqm].c=$.extend({},H[this._jqm].c,o);s++;this._jqm=s;
H[s]={c:$.extend(p,$.jqm.params,o),a:F,w:$(this).addClass('jqmID'+s),s:s};
if(p.trigger)$(this).jqmAddTrigger(p.trigger);
});};

$.fn.jqmAddClose=function(e){return hs(this,e,'jqmHide');};
$.fn.jqmAddTrigger=function(e){return hs(this,e,'jqmShow');};
$.fn.jqmShow=function(t){return this.each(function(){t=t||window.event;$.jqm.open(this._jqm,t);});};
$.fn.jqmHide=function(t){return this.each(function(){t=t||window.event;$.jqm.close(this._jqm,t)});};

$.jqm = {
hash:{},
open:function(s,t){var h=H[s],c=h.c,cc='.'+c.closeClass,z=(parseInt(h.w.css('z-index'))),z=(z>0)?z:3000,o=$('<div></div>').css({height:'100%',width:'100%',position:'fixed',left:0,top:0,'z-index':z-1,opacity:c.overlay/100});if(h.a)return F;h.t=t;h.a=true;h.w.css('z-index',z);
 if(c.modal) {if(!A[0])L('bind');A.push(s);}
 else if(c.overlay > 0)h.w.jqmAddClose(o);
 else o=F;

 h.o=(o)?o.addClass(c.overlayClass).prependTo('body'):F;
 if(ie6){$('html,body').css({height:'100%',width:'100%'});if(o){o=o.css({position:'absolute'})[0];for(var y in {Top:1,Left:1})o.style.setExpression(y.toLowerCase(),"(_=(document.documentElement.scroll"+y+" || document.body.scroll"+y+"))+'px'");}}

 if(c.ajax) {var r=c.target||h.w,u=c.ajax,r=(typeof r == 'string')?$(r,h.w):$(r),u=(u.substr(0,1) == '@')?$(t).attr(u.substring(1)):u;
  r.html(c.ajaxText).load(u,function(){if(c.onLoad)c.onLoad.call(this,h);if(cc)h.w.jqmAddClose($(cc,h.w));e(h);});}
 else if(cc)h.w.jqmAddClose($(cc,h.w));

 if(c.toTop&&h.o)h.w.before('<span id="jqmP'+h.w[0]._jqm+'"></span>').insertAfter(h.o);	
 (c.onShow)?c.onShow(h):h.w.show();e(h);return F;
},
close:function(s){var h=H[s];if(!h.a)return F;h.a=F;
 if(A[0]){A.pop();if(!A[0])L('unbind');}
 if(h.c.toTop&&h.o)$('#jqmP'+h.w[0]._jqm).after(h.w).remove();
 if(h.c.onHide)h.c.onHide(h);else{h.w.hide();if(h.o)h.o.remove();} return F;
},
params:{}};
var s=0,H=$.jqm.hash,A=[],ie6=$.browser.msie&&($.browser.version == "6.0"),F=false,
i=$('<iframe src="javascript:false;document.write(\'\');" class="jqm"></iframe>').css({opacity:0}),
e=function(h){if(ie6)if(h.o)h.o.html('<p style="width:100%;height:100%"/>').prepend(i);else if(!$('iframe.jqm',h.w)[0])h.w.prepend(i); f(h);},
f=function(h){try{$(':input:visible',h.w)[0].focus();}catch(_){}},
L=function(t){$()[t]("keypress",m)[t]("keydown",m)[t]("mousedown",m);},
m=function(e){var h=H[A[A.length-1]],r=(!$(e.target).parents('.jqmID'+h.s)[0]);if(r)f(h);return !r;},
hs=function(w,t,c){return w.each(function(){var s=this._jqm;$(t).each(function() {
 if(!this[c]){this[c]=[];$(this).click(function(){for(var i in {jqmShow:1,jqmHide:1})for(var s in this[i])if(H[this[i][s]])H[this[i][s]].w[i](this);return F;});}this[c].push(s);});});};
})(jQuery);


/* Modal Drag'n'Resize */
(function($){
$.fn.jqDrag=function(h){return i(this,h,'d');};
$.fn.jqResize=function(h){return i(this,h,'r');};
$.jqDnR={dnr:{},e:0,
drag:function(v){
 if(M.k == 'd')E.css({left:M.X+v.pageX-M.pX,top:M.Y+v.pageY-M.pY});
 else E.css({width:Math.max(v.pageX-M.pX+M.W,0),height:Math.max(v.pageY-M.pY+M.H,0)});
  return false;},
stop:function(){E.css('opacity',M.o);$().unbind('mousemove',J.drag).unbind('mouseup',J.stop);}
};
var J=$.jqDnR,M=J.dnr,E=J.e,
i=function(e,h,k){return e.each(function(){h=(h)?$(h,e):e;
 h.bind('mousedown',{e:e,k:k},function(v){var d=v.data,p={};E=d.e;
 // attempt utilization of dimensions plugin to fix IE issues
 if(E.css('position') != 'relative'){try{E.position(p);}catch(e){}}
 M={X:p.left||f('left')||0,Y:p.top||f('top')||0,W:f('width')||E[0].scrollWidth||0,H:f('height')||E[0].scrollHeight||0,pX:v.pageX,pY:v.pageY,k:d.k,o:E.css('opacity')};
 E.css({opacity:0.8});$().mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
 return false;
 });
});},
f=function(k){return parseInt(E.css(k))||false;};
})(jQuery);

		