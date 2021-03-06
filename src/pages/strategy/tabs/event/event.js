(function(){
	"use strict";
	
	KC3StrategyTabs.event = new KC3StrategyTab("event");
	
	KC3StrategyTabs.event.definition = {
		tabSelf: KC3StrategyTabs.event,
		
		maps : {},
		selectedWorld: 0,
		selectedMap: 0,
		itemsPerPage: 20,
		currentSorties: [],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			if(typeof localStorage.maps != "undefined"){
				this.maps = JSON.parse( localStorage.maps );
			}else{
				return false;
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var
				self = this,
				diffStr = ["E","N","H"];
			
			// On-click world menus
			$(".tab_event .world_box").on("click", function(){
				self.selectedWorld = $(this).data("world_num");
				$(".tab_event .world_box").removeClass("active");
				$(this).addClass("active");
				
				$(".tab_event .map_list").html("");
				$(".tab_event .page_list").html("");
				$(".tab_event .sortie_list").html("");
			
				var mapBox;
				
				// Check player's map list
				$.each(self.maps, function(index, element){
					var cWorld = (""+element.id).substr(0, (""+element.id).length-1);
					var cMap = (""+element.id).substr((""+element.id).length-1);
					
					// If this map is part of selected world
					if(cWorld == self.selectedWorld){
						mapBox = $(".tab_event .factory .map_box").clone().appendTo(".tab_event .map_list");
						mapBox.data("map_num", cMap);
						$(".map_title", mapBox).text("E - "+cMap+(function(x){
							switch(x){
								case 1: case 2: case 3:
									return " " + diffStr[x-1];
								default:
									return "";
							}
						})(element.difficulty));
						
						// EASY MODO STRIKES BACK
						if(ConfigManager.info_troll && element.difficulty==1) {
							mapBox.addClass("easymodokimoi");
						}
						// If this map is already cleared
						if(element.clear == 1){
							$(".map_hp_txt", mapBox).text("Cleared!");
							mapBox.addClass("cleared");
						}else{
							mapBox.addClass("notcleared");
							// If HP-based gauge
							if(typeof element.maxhp != "undefined"){
								if(element.curhp>1){ // i want to approach last kill as JUST DO IT instead leaving 1HP only.
									$(".map_hp_txt", mapBox).text( element.curhp+" / "+element.maxhp );
									$(".map_bar", mapBox).css("width", ((element.curhp/element.maxhp)*80)+"px");
								}else{
									mapBox.addClass("noclearnogauge");
									if(ConfigManager.info_troll)
										mapBox
											.addClass("justdoit")
											.attr("title","just kill her already, yesterday you said tommorow! JUST DO IT!!!"); // placeholder class... 
									$(".map_hp_txt", mapBox).text(ConfigManager.info_troll ? "#JustDoIt!" : KC3Meta.term("StrategyEvents1HP"));
								}
							// If kill-based gauge
							}else{
								var totalKills = KC3Meta.gauge( element.id );
								var killsLeft = totalKills - element.kills;
								if(totalKills){
									$(".map_hp_txt", mapBox).text( killsLeft+" / "+totalKills+" kills left");
									$(".map_bar", mapBox).css("width", ((killsLeft/totalKills)*80)+"px");
								} else {
									mapBox.addClass("noclearnogauge");
									$(".map_hp_txt", mapBox).text("Not cleared");
								}
							}
						}
					}
				});
				
				$("<div>").addClass("clear").appendTo(".tab_event .map_list");
				$(".tab_event .map_list .map_box.active").trigger("click");
			});
			
			// On-click map menus
			$(".tab_event .map_list").on("click", ".map_box", function(){
				self.selectedMap = parseInt( $(this).data("map_num"), 10);
				$(".tab_event .map_box").removeClass("active");
				$(this).addClass("active");
				self.showMap();
			});
			
			// Select default opened world
			$(".tab_event .world_box.active").trigger("click");
			
			// On-click sortie toggles
			$(".tab_event .sortie_list").on("click", ".sortie_box .sortie_toggles .sortie_toggle", function(){
				var targetName = $(this).data("target");
				var targetParent = $(this).parent().parent().parent();
				var targetBox = targetParent.find("."+targetName);
				var expandedQualif = !$(this).hasClass("sortie_toggle_in");
				var expandedBefore = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(this).parent()).length;
				
				if( $(this).hasClass("active") ){
					$(this).removeClass("active");
				}else{
					$(this).addClass("active");
				}
				
				var expandedAfter = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(this).parent()).length;
				
				// Show or hide the target box
				targetBox.slideToggle(undefined,function(){
					if(expandedQualif && expandedBefore < 1)
						targetParent.addClass("expanded");
				});
				if(expandedQualif && expandedAfter < 1)
					targetParent.removeClass("expanded");
			});
		},
		
		/* SHOW MAP
		A map has been selected
		---------------------------------*/
		showMap :function(){
			var self = this;
			this.pageNum = 1;
			$(".tab_event .page_list").html("");
			$(".tab_event .sortie_list").html("");
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.count_normal_sorties(function(countSorties){
					self.showPagination(countSorties);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, function(countSorties){
						console.log("count_world", countSorties);
						self.showPagination(countSorties);
					});
					
				// Selected specifc map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, function(countSorties){
						console.log("count_map", countSorties);
						self.showPagination(countSorties);
					});
				}
			}
		},
		
		/* SHOW PAGINATION
		Show list of clickable page boxes
		---------------------------------*/
		showPagination :function(countSorties){
			var self = this;
			var countPages = Math.ceil( countSorties / this.itemsPerPage );
			$(".tab_event .page_list").html('<ul class="pagination pagination-sm"></ul>');
			
			console.log(countPages);
			if(countPages > 0){
				$(".tab_event .pagination").twbsPagination({
					totalPages: countPages,
					visiblePages: 9,
					onPageClick: function (event, page) {
						self.pageNum = page;
						self.showPage();
					}
				});
				self.pageNum = 1;
				self.showPage();
			}else{
				$(".tab_event .pagination").hide();
			}
		},
		
		/* SHOW PAGE
		Determines list type and gets data from IndexedDB
		---------------------------------*/
		showPage :function(){
			var self = this;
			$(".tab_event .pagination").hide();
			$(".tab_event .sortie_list").html("");
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.get_normal_sorties(this.pageNum, this.itemsPerPage, function( sortieList ){
					self.showList( sortieList );
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.get_world(this.selectedWorld, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
					
				// Selected specifc map
				}else{
					KC3Database.get_map(this.selectedWorld, this.selectedMap, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
				}
			}
		},
		
		/* SHOW LIST
		Shows sorties on interface using list of collected sortie objects
		---------------------------------*/
		showList :function( sortieList ){
			// Show sortie records on list
			var sortieBox, fleets, fleetkey, mainFleet, isCombined, rshipBox, nodeBox, thisNode;
			$.each(sortieList, function(id, sortie){
				// Create sortie box
				sortieBox = $(".tab_event .factory .sortie_box").clone().appendTo(".tab_event .sortie_list");
				if((sortie.diff || 0) > 0)
					$(sortieBox)
						.addClass("sortie_rank_"+sortie.diff)
						.attr("data-diff",KC3Meta.term("EventHistoryRank"+sortie.diff+(ConfigManager.info_troll ? "X" : "")));
				$(".sortie_id", sortieBox).html( sortie.id );
				$(".sortie_date", sortieBox).html( new Date(sortie.time*1000).format("mmm d") );
				$(".sortie_date", sortieBox).attr("title", new Date(sortie.time*1000).format("mmm d, yyyy hh:MM:ss") );
				$(".sortie_map", sortieBox).html( "E-" + sortie.mapnum );
				
				fleetkey = ["main","escort","preboss","boss"];
				fleets   = [
					sortie.fleetnum,
					(parseInt(sortie.combined) ? 2 : 0),
					sortie.support1,
					sortie.support2
				];
				// Show main fleet faces
				$(".sortie_ship", sortieBox).hide();
				fleets.forEach(function(n,i){
					if(!n) {
						$(".rfleet_"+fleetkey[i], sortieBox).addClass("disabled");
						return false;
					}
					var selFleet = sortie["fleet"+n];
					$.each(selFleet, function(index, ship){
						// false recorded on older sorties. stop loop when encountered
						if(i===0) {
							if(ship===false){ return false; }
							
							$(".sortie_ship_"+(index+1)+" img", sortieBox).attr("src", KC3Meta.shipIcon(ship.mst_id));
							$(".sortie_ship_"+(index+1), sortieBox).show();
						}
						
						rshipBox = $(".tab_event .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox)
							.attr("src", KC3Meta.shipIcon(ship.mst_id) )
							.click(function(){
								var ref = $(this).parent().parent();
								if($(".rfleet_detail",ref).css("display")=="none") {
									$(".rfleet_detail",ref).show();
									$(".rfleet_equips",ref).hide();
								} else {
									$(".rfleet_detail",ref).hide();
									$(".rfleet_equips",ref).show();
								}
							});
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						
						ship.equip.filter(function(x){return x>0;})
							.forEach(function(x,i){
								var masterGear = KC3Master.slotitem(x);
								$(".rfleet_equips .rfleet_equip.rfleet_equip_"+(i+1),rshipBox)
									.find('img')
									.attr("src","../../assets/img/items/" + masterGear.api_type[3] + ".png")
									.attr("title",KC3Meta.gearName(masterGear.api_name));
							});
						$(".rfleet_detail", rshipBox).show();
						$(".rfleet_equips", rshipBox).hide();
						
						$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append( $("<div>").addClass("clear") 
					);
				});
/*				mainFleet = sortie["fleet"+sortie.fleetnum];
				$.each(mainFleet, function(index, ship){
					// false recorded on older sorties. stop loop when encountered
					if(ship===false){ return false; }
					
					$(".sortie_ship_"+(index+1)+" img", sortieBox).attr("src", KC3Meta.shipIcon(ship.mst_id));
					$(".sortie_ship_"+(index+1), sortieBox).show();
					
					rshipBox = $(".tab_event .factory .rfleet_ship").clone();
					$(".rfleet_pic img", rshipBox)
						.attr("src", KC3Meta.shipIcon(ship.mst_id) )
						.click(function(){
							var ref = $(this).parent().parent();
							if($(".rfleet_detail",ref).css("display")=="none") {
								$(".rfleet_detail",ref).show();
								$(".rfleet_equips",ref).hide();
							} else {
								$(".rfleet_detail",ref).hide();
								$(".rfleet_equips",ref).show();
							}
						});
					$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
					$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
					
					ship.equip.filter(function(x){return x>0;})
					  .forEach(function(x,i){
							var masterGear = KC3Master.slotitem(x);
							$(".rfleet_equips .rfleet_equip.rfleet_equip_"+(i+1),rshipBox)
								.find('img')
								.attr("src","../../assets/img/items/" + masterGear.api_type[3] + ".png")
								.attr("title",KC3Meta.gearName(masterGear.api_name));
						});
					$(".rfleet_detail", rshipBox).show();
					$(".rfleet_equips", rshipBox).hide();
					
					$(".rfleet_main .rfleet_body", sortieBox).append( rshipBox );
				});
				$(".rfleet_main .rfleet_body", sortieBox).append( $("<div>").addClass("clear") 
				);
				
				// Check if combined fleet
				isCombined = false; 
				if(typeof sortie.combined !== "undefined"){
					if(sortie.combined > 0){
						isCombined = true;
					}
				}
				
				// Escort Fleet  Expedition
				if(isCombined){
					$.each(sortie.fleet2, function(index, ship){
						rshipBox = $(".tab_event .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_escort .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_escort .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_escort", sortieBox).addClass("disabled");
				}
				
				// Preboss Support
				if(sortie.support1 > 0){
					$.each(sortie["fleet"+sortie.support1], function(index, ship){
						rshipBox = $(".tab_event .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_preboss .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_preboss .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_preboss", sortieBox).addClass("disabled");
				}
				
				// Boss support Expedition
				if(sortie.support2 > 0){
					$.each(sortie["fleet"+sortie.support2], function(index, ship){
						rshipBox = $(".tab_event .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_boss .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_boss .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_boss", sortieBox).addClass("disabled");
				}*/
				
				// console.log("sortie.battles", sortie.battles);
				
				// For each battle
				$.each(sortie.battles, function(index, battle){
					var battleData, isDayBattle = true;
					
					// Determine if day or night battle node
					if(typeof battle.data.api_dock_id != "undefined"){
						battleData = battle.data;
					}else if(typeof battle.data.api_deck_id != "undefined"){
						battleData = battle.data;
					}else if(typeof battle.yasen.api_deck_id != "undefined"){
						battleData = battle.yasen;
						isDayBattle = false;
					}else{
						return true;
					}
					
					// Show on node list
					$(".sortue_edge_"+(index+1), sortieBox).addClass("active");
					$(".sortue_edge_"+(index+1), sortieBox).html( KC3Meta.nodeLetter( sortie.world, sortie.mapnum, battle.node ) );
					
					// HTML elements
					nodeBox = $(".tab_event .factory .sortie_nodeinfo").clone();
					$(".node_id", nodeBox).text( KC3Meta.nodeLetter( sortie.world, sortie.mapnum, battle.node ) );
					
					// Result Icons
					$(".node_formation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[0]) );
					$(".node_formation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[0]) );
					$(".node_rating img", nodeBox).attr("src", "../../assets/img/client/ratings/"+battle.rating+".png");
					
					// Kanmusu Drop
					if(battle.drop > 0){
						$(".node_drop img", nodeBox).attr("src", KC3Meta.shipIcon( battle.drop ) );
					}else{
						$(".node_drop img", nodeBox).attr("src", "../../assets/img/ui/shipdrop-x.png");
					}
					
					// Support Exped Triggered
					if(battle.data.api_support_flag > 0){
						$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support.png");
					}else{
						$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support-x.png");
					}
					
					// Enemies
					$(".node_eformation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[1]) );
					$(".node_eformation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[1]) );
					$.each(battleData.api_ship_ke, function(index, eship){
						if(eship > -1){
							$(".node_eship_"+(index+1)+" img", nodeBox).attr("src", KC3Meta.abyssIcon( eship ) );
							$(".node_eship_"+(index+1), nodeBox).attr("title", KC3Master.ship( eship ).api_name + KC3Master.ship( eship ).api_yomi );
							$(".node_eship_"+(index+1), nodeBox).show();
						}
					});
					
					// Process Battle
					PlayerManager.combinedFleet = sortie.combined;
					thisNode = (new KC3Node()).defineAsBattle();
					if(typeof battle.data.api_dock_id != "undefined"){
						thisNode.engage( battleData, sortie.fleetnum );
					}else if(typeof battle.data.api_deck_id != "undefined"){
						thisNode.engage( battleData, sortie.fleetnum );
					}else if(typeof battle.yasen.api_deck_id != "undefined"){
						thisNode.engageNight( battleData, sortie.fleetnum );
					}
					
					// Conditions
					$(".node_engage", nodeBox).text( thisNode.engagement[2] );
					$(".node_engage", nodeBox).addClass( thisNode.engagement[1] );
					$(".node_contact", nodeBox).text(thisNode.fcontact +" vs "+thisNode.econtact);
					
					// Day Battle-only data
					if(isDayBattle){
						$(".node_detect", nodeBox).text( thisNode.detection[0] );
						$(".node_detect", nodeBox).addClass( thisNode.detection[1] );
						
						$(".node_airbattle", nodeBox).text( thisNode.airbattle[0] );
						$(".node_airbattle", nodeBox).addClass( thisNode.airbattle[1] );
						
						// Plane total counts
						$(".node_FFT", nodeBox).text(thisNode.planeFighters.player[0]);
						$(".node_FAT", nodeBox).text(thisNode.planeFighters.abyssal[0]);
						$(".node_BFT", nodeBox).text(thisNode.planeBombers.player[0]);
						$(".node_BAT", nodeBox).text(thisNode.planeBombers.abyssal[0]);
						
						// Plane losses
						if(thisNode.planeFighters.player[1] > 0){
							$(".node_FFL", nodeBox).text("-"+thisNode.planeFighters.player[1]);
						}
						if(thisNode.planeFighters.abyssal[1] > 0){
							$(".node_FAL", nodeBox).text("-"+thisNode.planeFighters.abyssal[1]);
						}
						if(thisNode.planeBombers.player[1] > 0){
							$(".node_BFL", nodeBox).text("-"+thisNode.planeBombers.player[1]);
						}
						if(thisNode.planeBombers.abyssal[1] > 0){
							$(".node_BAL", nodeBox).text("-"+thisNode.planeBombers.abyssal[1]);
						}
					}
					
					// Add box to UI
					$(".sortie_nodes", sortieBox).append( nodeBox );
				});
				$(".sortie_nodes", sortieBox).append( $("<div>").addClass("clear") );
			});
			
			$(".tab_event .pagination").show();
		}
	};
	
})();