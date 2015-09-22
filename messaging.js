(function($){  

	var options_default = {  
		message_type: "", 
		message_type_class : "" , 
		message_title : "" , 
		message_context: "" ,  
		message_class : "flash-message" ,
		message_auto_close : true , 
		message_show_time : 5 ,
		message_keep_alive : false ,
		message_name : "" ,
		message_live_in : "/" ,
		message_stack : false ,
		message_stack_length : 0
	 }; 
	
	var countMessage=0;
	 $.fn.messaging = function(options) {  

		var options = $.extend(options_default, options);  

		var messageQueue=new Object();
		
		var runDelay=function(second , doneFunction , stepFunction , messageQueueObject){
			var waitTime=second * 1000;
			var dfr=$.Deferred();
			var count=second;
			messageQueueObject.delaySituate="run"; 
			messageQueueObject.intervalID = setInterval(function(){ 
												count--; 
												stepFunction(dfr,count);
												messageQueueObject.delayRemain = count;
												},1000);
												
			messageQueueObject.timeoutID = setTimeout(function(){
										doneFunction();
										clearInterval(messageQueueObject.intervalID);
										dfr.resolve();
										clearTimeout(messageQueueObject.timeoutID);
										},waitTime);

			return dfr;
		};
		
		var stopDelay=function(messageQueueObject , newDelaySituate){
			if(messageQueueObject.delaySituate == "run" && options.message_auto_close ){ 
				clearInterval(messageQueueObject.intervalID);
				clearTimeout(messageQueueObject.timeoutID);
				messageQueueObject.delaySituate = newDelaySituate ;
			}
		};
		
		var resumeDelay=function(second , doneFunction , stepFunction , messageQueueObject){
			if(messageQueueObject.delaySituate == "stop"  && options.message_auto_close && messageQueueObject.delayRemain !== false){ 
				runDelay(second , doneFunction , stepFunction ,messageQueueObject );
			}
		};

		function makeMessageBody(message_text,messageClassType){
			countMessage++;
			var messageContainer=$("<div/>").addClass( options.message_class + " fl-msg-" + messageClassType ).css({opacity:"0.8"}).attr("id","fl-msg-"+messageClassType+"-"+countMessage);
			var messageClose=$("<span/>").addClass("fl-msg-close");
			var messageContext=$("<div/>").addClass("fl-msg-text");
			var messageCounter=$("<div/>").addClass("fl-msg-close-counter");
			var messageTitle=$("<div/>").addClass("fl-msg-title").text(options.message_title);
			var messageImage=$("<div/>").addClass("fl-msg-image");
			var messageContentContainer=$("<p/>").append(messageImage).append(messageTitle).append(options.message_context);
			var messageNumber=$("<div/>").addClass("fl-msg-count").css({display:"none"}).attr("id",countMessage);
			messageContext.append(messageContentContainer).append(messageNumber);
													
			messageQueue["msg_"+countMessage]=new Object();
			messageQueue["msg_"+countMessage].type=options.message_type;
			messageQueue["msg_"+countMessage].delaySituate="stop";
			messageQueue["msg_"+countMessage].delayRemain=false;
			messageQueue["msg_"+countMessage].showComplete=$.Deferred();

			return messageContainer.append(messageClose)
								.append(messageContext)
								.append(messageCounter)
								.append($("<div/>").css({clear:"both"}));
		}
		
		
		function getCookie( check_name ) {
			var a_all_cookies = document.cookie.split( ';' );
			var a_temp_cookie = '';
			var cookie_name = '';
			var cookie_value = '';
			var b_cookie_found = false; 
			for ( i = 0; i < a_all_cookies.length; i++ ){
				a_temp_cookie = a_all_cookies[i].split( '=' );
				cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');
				if ( cookie_name == check_name ){
					b_cookie_found = true;
					if ( a_temp_cookie.length > 1 ){
						cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
					}
					return cookie_value;
					break;
				}
				a_temp_cookie = null;
				cookie_name = '';
			}
			if ( !b_cookie_found ){
				return null;
			}
		}
		
		function deleteCookie( name, path, domain ) {
			if ( getCookie( name ) ) document.cookie = name + "=" +
			( ( path ) ? ";path=" + path : "") +
			( ( domain ) ? ";domain=" + domain : "" ) + ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
		}
		
		function setCookie( name, value, expires, path, domain, secure ){
			var today = new Date();
			today.setTime( today.getTime() );

			if ( expires )
				expires = expires * 1000 * 60 * 60 * 24;
			var expires_date = new Date( today.getTime() + (expires) );
			document.cookie = name + "=" +escape( value ) +
			( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" ) +
			( ( path ) ? ";path=" + path : "" ) +
			( ( domain ) ? ";domain=" + domain : "" ) +
			( ( secure ) ? ";secure" : "" );
		}

		function readCookieMessages(messageName){
			var messageType ;
		}
		
		function add_message(messageContainer){
			var message = makeMessageBody(options.message_context,options.message_type);
			message.css("display","none");
			$(messageContainer).append(message);
			message.slideDown(function(){
				messageQueue["msg_"+$(".fl-msg-count",this).attr("id")].showComplete.resolve();
			});
			return message;
		}
		
		function messageStackControll(messageContainer){
			if(!options.message_stack){
				$("."+options.message_class,messageContainer).each(function(index , message){
					message_close($(message));
				});
			}else if(options.message_stack_length>0){
				var stackLength=0;
				var firstMessage=null;
				
				$("."+options.message_class,messageContainer).each(function(message, index){
					stackLength++;
				});
				
				if(stackLength==options.message_stack_length){
					stackLength--;
					firstMessage=$("."+options.message_class+":first",messageContainer);
					message_close(firstMessage);
				}
			}
		}
		
		function activeMessageEvent(message){ 
			var messageID=$(".fl-msg-count",message).attr("id");
			var messageQueueObject=messageQueue["msg_"+messageID];
			
			$(".fl-msg-close",message).click(function(){
					message_close(message);
					});

				message.mouseover(function(){
					$(this).stop().fadeTo('fast',1); 
					stopDelay(messageQueueObject , "stop");
					});
					
				message.mouseout(function(){
					$(this).stop().fadeTo('fast',0.8);
					resumeDelay( messageQueueObject.delayRemain ,
								function(){message_close(message);} , 
								function(dfr,count){updateCounter(count);} , 
								messageQueueObject
							   );
					});

			if(options.message_auto_close){
				messageQueueObject.delayRemain=options.message_show_time;
				$(".fl-msg-close-counter",message).append($("<div/>").attr("id","fl-msg-close-counter-action").addClass("fl-msg-close-counter-pause"));
				$(".fl-msg-close-counter",message).append($("<div/>").addClass("fl-msg-close-counter-number"));
				
				var updateCounter=function(count){
					$(".fl-msg-close-counter .fl-msg-close-counter-number",message).text(count);
				};
				
				updateCounter(options.message_show_time);
				
				$(".fl-msg-close-counter",message).find("#fl-msg-close-counter-action").click(function(){
					var messageQueueObject=messageQueue["msg_"+$(".fl-msg-count",message).attr("id")];
					
					$(this).toggleClass( "fl-msg-close-counter-play" ); 
					if(messageQueueObject.delaySituate == "run")
						stopDelay(messageQueueObject , "pause");
					else if(messageQueueObject.delaySituate == "stop" )
						messageQueueObject.delaySituate = "pause";
					else if(messageQueueObject.delaySituate == "pause" ){
						messageQueueObject.delaySituate = "stop";
						resumeDelay( messageQueueObject.delayRemain ,
								function(){message_close(message);} , 
								function(dfr,count){updateCounter(count);} , 
								messageQueueObject
							   );
						}
				});
				
				var msgDfr=runDelay( options.message_show_time ,
									function(){message_close(message);} , 
									function(dfr,count){updateCounter(count);} , 
									messageQueueObject
								  );
			}

		}
		
		function message_close(message){
			var messageID=$(".fl-msg-count",message).attr("id");
			
			message.unbind("mouseover").unbind("mouseout");
			message.stop().slideUp(function(){
							$(this).remove(); 
							delete( messageQueue["msg_"+messageID] );
							deleteCookie( options.message_name , null , options.message_live_in );
						});
		}

		 return this.each(function() { 	
			messageStackControll($(this));
			var message=add_message($(this));
			messageQueue["msg_"+$(".fl-msg-count",message).attr("id")].showComplete.done(function(){
				activeMessageEvent(message);
			});
			
		 }); 
	 };  
})(jQuery);  



