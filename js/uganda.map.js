;
(function (d3, $, queue, window) {
	'use strict';
	// https://www.humanitarianresponse.info/en/operations/afghanistan/cvwg-3w
	// https://public.tableau.com/profile/geo.gecko#!/vizhome/Districtpolygon/v1?publish=yes
	'use strict';
	String.prototype.replaceAll = function (search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};
	String.prototype.capitalize = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
	// function capitalizeFirstLetter(string) {
	//   return string.charAt(0).toUpperCase() + string.slice(1);
	// }
	var _selectedDataset;
	var dataset;
	queue()
	// .defer(d3.json, "./UgandaDistricts.geojson")//DNAME_06
		.defer(d3.json, "./data/UgandaDistricts.highlighted_.geojson")
		.defer(d3.csv, "./data/mapValues.csv")
		.defer(d3.csv, "./data/dataset.csv")
		.await(ready);





	var global = {};
	global.selectedDistrict = []; // name
	global.selectedSector = []; // ID
	global.selectedAgency = []; // ID
	global.selectedUn = []; // Type UN
	global.selectedIp = []; // Type IP
	global.selectedOp = []; // Type OP
	global.selectedDonor = []; // Type Donor
	global.selectedActorType = []; // Type Actor
	global.districtCount;
	global.sectorCount;
	global.agencyCount;
	global.beneficiaryCount;
	global.unCount;
	global.ipCount;
	global.opCount;
	global.currentEvent;
	// global.needRefreshDistrict;


	function refreshCounts() {
		d3.select("#district-count").text(global.districtCount);
		d3.select("#sector-count").text(global.sectorCount);
		d3.select("#agency-count").text(global.agencyCount);
		d3.select("#beneficiary-count").text(global.beneficiaryCount);
		d3.select("#agencyUN-count").text(global.unCount);
		d3.select("#agencyIP-count").text(global.ipCount);
		d3.select("#agencyOP-count").text(global.opCount);
		global.selectedDistrict = [];
		global.selectedSector = [];
		global.selectedAgency = [];
		global.beneficiaryCount = [];
		global.selectedUn = [];
		global.selectedIp = [];
		global.selectedOp = [];

		_selectedDataset = dataset;
	}

	function addLegend(domain, color) {

		d3.select("#legend").select("svg").remove();
		var N = 4;
		var step = Math.round((domain[1] - domain[0]) / N);
		var array = [domain[0] + Math.round(step - step / 2), domain[0] + Math.round(step * 2 - step / 2), domain[0] + Math.round(step * 3 - step / 2), domain[0] + Math.round(step * 4 - step / 2)];
		var arrayLabel = [domain[0].toString() + " - " + (domain[0] + step).toString(), (domain[0] + step + 1).toString() + " - " + (domain[0] + step * 2).toString(), (domain[0] + step * 2 + 1).toString() + " - " + (domain[0] + step * 3).toString(), (domain[0] + step * 3 + 1).toString() + " - " + domain[1].toString()];

		var legend = d3.selectAll('.c3-legend-item');
		var legendSvg = d3.select('#legend')
		.append('svg')
		.attr('width', 150)
		.attr('height', 150);
		legend.each(function () {
			svg.node().appendChild(this);
		});

		var legendX = 0;
		var legendDY = 20;
		legendSvg.selectAll('.legend-rect')
			.data(array)
			.enter()
			.append('rect')
			.attr('class', 'legend-rect')
			.attr("x", legendX)
			.attr("y", function (d, i) {
			return (i + 1) * legendDY;
		})
			.attr("width", 20)
			.attr("height", 20)
			.style("stroke", "black")
			.style("stroke-width", 0)
			.style("fill", function (d) {
			return color(d);
		});
		//the data objects are the fill colors

		legendSvg.selectAll('.legend-text')
			.data(array)
			.enter()
			.append('text')
			.attr('class', 'legend-text')
			.attr("x", legendX + 25)
			.attr("y", function (d, i) {
			return (i) * legendDY + 25;
		})
			.attr("dy", "0.8em") //place text one line *below* the x,y point
			.text(function (d, i) {
			return arrayLabel[i];
		});

		legendSvg.selectAll('.legend-title')
			.data(["Number of Agencies"])
			.enter()
			.append('text')
			.attr('class', 'legend-title')
			.attr("x", legendX)
			.attr("y", 0)
			.attr("dy", "0.8em") //place text one line *below* the x,y point
			.text(function (d, i) {
			return d;
		});

	}

	function ready(error, ugandaGeoJson, sector, relationship) {
		//standard for if data is missing, the map shouldnt start.
		if (error) {
			throw error;
		};
		ugandaGeoJson.features.map(function (d) {
			d.properties.DNAME_06 = d.properties.dist;
		});

		$(".custom-list-header").click(function () {
			$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
			$(this).siblings(".custom-list").toggleClass('collapsed');
			$(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
		});

		// Collapses all the boxes apart from subCounty
		$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
		$("#agency-list.custom-list").removeClass('collapsed');



		//		console.log(relationship)

		//need join all data
		var nameAbbKays = d3.keys(relationship[0]);
		var sectorKays = d3.keys(sector[0]);
		dataset = relationship.map(function (d) {
			//			console.log(d)
			var i;

			for (i = 0; i < sector.length; i++) {
				if (sector[i].Activity === d.Activity) {
					sectorKays.map(function (k) {
						d[k] = sector[i][k];
					});
					break;
				}
			}
			return d;
		});
		var districtList = d3.nest().key(function (d) {
			if(d.Parish !== "") {
				return d.Parish;
			}
		}).sortKeys(d3.ascending).entries(relationship);

		var sectorList = d3.nest().key(function (d) {
			if(d.Activity !== "") {
				return d.Activity;
			}
		}).sortKeys(d3.ascending).entries(sector);

		var agencyList = d3.nest().key(function (d) {
			if(d["Agency name"] !== "") {
				return d["Agency name"];
			}
		}).sortKeys(d3.ascending).entries(relationship);


		var donorList = d3.nest().key(function (d) {
			if(d["Donor"] !== "") {
				return d["Donor"];
			}
		}).sortKeys(d3.ascending).entries(relationship);

		var actorTypeList = d3.nest().key(function (d) {
			if(d["Actor type"] !== "") {
				return d["Actor type"];
			}
		}).sortKeys(d3.ascending).entries(sector);

		var beneficiaries = d3.sum(relationship, function(d){return parseFloat(d.Beneficiaries)});



		global.districtCount = districtList.length;
		global.sectorCount = sectorList.length;
		global.agencyCount = agencyList.length; //to remove the count of NO DATA
		global.beneficiaryCount = beneficiaries;

		refreshCounts();
		updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);



		var h = (window.innerHeight ||
				 document.documentElement.clientHeight ||
				 document.body.clientHeight);
		if (h > 540) {
			d3.select(".list-container").style("height", h + "px");
			d3.select("#d3-map-wrapper").style("height", h + "px");
		}
		var w = (window.innerWidth ||
				 document.documentElement.clientWidth ||
				 document.body.clientWidth);
		d3.select(".list-container").style("height", h - 0 + "px")

		var map = new L.Map("d3-map-container", {
			center: [0.3233, 32.5625],
			zoom: 12,
			zoomControl: false
		});
		var _3w_attrib = 'Created by <a href="http://www.geogecko.com">Geo Gecko</a> and © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Powered by <a href="https://d3js.org/">d3</a>';
		var basemap = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});

		basemap.addTo(map);
		var sidebar = L.control.sidebar('sidebar', {
			closeButton: true,
			position: 'right'
		});
		map.addControl(sidebar);

		setTimeout(function () {
			sidebar.show();
		}, 500);

		map.bounds = [],
			map.setMaxBounds([
			[4.5,29.5],
			[-1.5,34.5]
		]);
		map.options.maxZoom=12;
		map.options.minZoom=7;

		var ugandaPath;
		var domain = [+Infinity, -Infinity];
		var opacity = 0.3;
		var wrapper = d3.select("#d3-map-wrapper");
		var width = wrapper.node().offsetWidth || 960;
		var height = wrapper.node().offsetHeight || 480;
		var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
		.interpolate(d3.interpolateHcl)
		.range([d3.rgb("#f7fcf5"), d3.rgb('#00441b')]); //#f597aa #a02842
		var tooltip = d3.select(map.getPanes().overlayPane)
		.append("div")
		.attr("class", "d3-tooltip d3-hide");
		var datasetNest = d3.nest().key(function (d) {
			if(d.key !== "") {
				return d.Parish;	
			}
		}).entries(dataset);

		function updateTable(data) {

			d3.select('#page-wrap').select('table').remove();

			var sortAscending = true;
			var table = d3.select('#page-wrap').append('table');
			var titles = d3.keys(data[0]);
			var headers = table.append('thead').append('tr')
			.selectAll('th')
			.data(titles).enter()
			.append('th')
			.text(function (d) {
				return d;
			})
			.on('click', function (d) {
				headers.attr('class', 'header');

				if (sortAscending) {
					rows.sort(function(a, b) { return b[d] < a[d]; });
					sortAscending = false;
					this.className = 'aes';
				} else {
					rows.sort(function(a, b) { return b[d] > a[d]; });
					sortAscending = true;
					this.className = 'des';
				}

			});

			var rows = table.append('tbody').selectAll('tr')
			.data(data).enter()
			.append('tr');
			rows.selectAll('td')
				.data(function (d) {
				return titles.map(function (k) {
					//					console.log(d[k]);
					if (k === 'values') {
						return { 'value': +(d[k].length), 'name': k};
					} else {
						return { 'value': d[k], 'name': k};
					}

				});
			}).enter()
				.append('td')
				.attr('data-th', function (d) {
				return d.name;
			})
				.text(function (d) {
				return d.value;
			});
		}

		var top5Values = datasetNest.sort(function(a,b){
			return b.values.length - a.values.length
		}).slice(1,6);
		updateTable(top5Values);


		var countries = [];
		var countriesOverlay = L.d3SvgOverlay(function (sel, proj) {
			var projection = proj.pathFromGeojson.projection;
			var path = d3.geo.path().projection(projection);

			ugandaPath = sel.selectAll('.district').data(countries);
			ugandaPath.enter()
				.append('path')
				.attr('d', proj.pathFromGeojson)
				.attr("z-index", "600")
				.attr("style", "pointer-events:all!important")
				.style("cursor", "pointer")
				.style("stroke", "#000")
				.each(function (d) {
				d.properties.centroid = projection(d3.geo.centroid(d));
				datasetNest.map(function (c) {
					if (c.key === d.properties.DNAME_06) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						d.properties._agencyList = d3.nest().key(function (a) {
							return a["Agency name"];
						}).entries(c.values);
						d.properties._unAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
							//return a.Actor_Type;
						}).entries(c.values);
						d.properties._ipAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
						}).entries(c.values);
						d.properties._opAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
						}).entries(c.values);
						domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
						domain[
							0];
						domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.on("mouseover", function (d) {
				d3.select(this).style("fill", "#aaa");
			})
				.on("mouseout", function (d) {
				d3.select(this).style("fill", d.properties._agencyList ? color(d.properties._agencyList.length) :
									  "#00000000");
				tooltip.classed("d3-hide", true);
			})
				.on("click", function (d) {
				var svg = d3.select(this.parentNode.parentNode.parentNode);
				var mouse = d3.mouse(svg.node()).map(function (d) {
					return parseInt(d);
				});
				var str = "<tr><button type='button' class='close' onclick='$(this).parent().hide();'>×</button></tr>" +
					"<th><br/></th><tr><th>Parish:</th> <th style='right: 0;'>" + d.properties.DNAME_06 + "</th></tr>"
				if (d.properties._sectorList && d.properties._agencyList) {

					//console.log(d.properties._agencyList);
					var agencyListAbb = d3.values(d.properties._agencyList).map(function (d) {
						console.log(d);
						return d.values.map(function (v) {
							return v.Abbreviation;
						});
					});

					//console.log(agencyListAbb);
					var tooltipList = "";
					var i = 0;
					while (i < agencyListAbb.length) {
						tooltipList = tooltipList + ("<p>" + agencyListAbb[i][0] + "</p>");
						i++
					}

					str = str + "<table style='width:100%'><tr><th>Sectors:</th> <th>" + d.properties._sectorList.length + "</th></tr>" +
						"<tr><th>Partners:</th> <th>" + d.properties._agencyList.length + "</th></tr><th><br/></th><div><tr> <th style='text-align: right;'>" + tooltipList + "</th></tr></table></div>";
					//console.log(d.properties._agencyList);
				}
				tooltip.html(str);

				var box = tooltip.node().getBoundingClientRect() || {
					height: 0
				};


				tooltip
					.classed("d3-hide", false)
					.attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[
					1] -
																			box.height) + "px; min-width: 200px; max-width: 200px; height: 150px; overflow-y: scroll;");
				tooltip
					.on("mouseover", function () {
					tooltip.classed("d3-hide", false);
				})
					.on("mouseout", function () {
					tooltip.classed("d3-hide", true);
				});
			})
				.style("fill", function (d) {
				return d.properties._agencyList ? color(d.properties._agencyList.length) : "#00000000"; //#3CB371
			})
				.attr("class", function (d) {
				return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
			});

			ugandaPath.attr('stroke-width', 1 / proj.scale)
				.each(function (d) {
				d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
				datasetNest.map(function (c) {
					if (c.key === d.properties.DNAME_06) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						d.properties._agencyList = d3.nest().key(function (a) {
							return a["Agency name"];
						}).entries(c.values);
						d.properties._unAgencyList = d3.nest().key(function (a) {
							return a.Name;
						}).entries(c.values);
						d.properties._ipAgencyList = d3.nest().key(function (a) {
							return a.Name;
						}).entries(c.values);
						d.properties._opAgencyList = d3.nest().key(function (a) {
							return a.Name;
						}).entries(c.values);
						domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
						domain[
							0];
						domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.style("fill", function (d) {
				return d.properties._agencyList ? color(d.properties._agencyList.length) : "#00000000"; //#3CB371
			})
				.attr("class", function (d) {
				return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
			});
			ugandaPath.exit().remove();
		});

		countries = ugandaGeoJson.features;
		countriesOverlay.addTo(map);


		addLegend(domain, color);




		function refreshMap() {
			global.selectedDistrict = [];
			ugandaPath.style("opacity", function (a) {
				a.properties._selected = false;
				return 1;
			});
			d3.selectAll('.labels').style("opacity", 1);
			d3.select("#district-list").selectAll("p").style("background", "transparent");
			d3.select("#sector-list").selectAll("p").style("background", "transparent");
			d3.select("#donor-list").selectAll("p").style("background", "transparent");
			d3.select("#agency-list").selectAll("p").style("background", "transparent");
			d3.select("#actor-type-list").selectAll("p").style("background", "transparent");
			updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);
			var domain = [+Infinity, -Infinity];
			ugandaPath.each(function (d) {
				datasetNest.map(function (c) {
					if (c.key === d.properties.DNAME_06) {
						d.properties._sectorList = d3.nest().key(function (a) {
							return a.Sector;
						}).entries(c.values);
						d.properties._agencyList = d3.nest().key(function (a) {
							return a["Agency name"];
						}).entries(c.values);
						d.properties._unAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
							//return a.Actor_Type;
						}).entries(c.values);
						d.properties._ipAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
						}).entries(c.values);
						d.properties._opAgencyList = d3.nest().key(function (a) {
							return a.Actor_Type;
						}).entries(c.values);
						domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
						domain[
							0];
						domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
						domain[
							1];
						color.domain(domain);
					}
				})
			})
				.style("fill", function (d) {
				if(d.properties._agencyList){
					return d.properties._agencyList.length ? color(d.properties._agencyList.length) : "#00000000"; //#3CB371
				}
				return "#00000000";
			});
			addLegend(domain, color);

			var top5Values = datasetNest.sort(function(a,b){
				return b.values.length - a.values.length
			}).slice(1,6);
			updateTable(top5Values);

			var beneficiaries = d3.sum(relationship, function(d){return parseFloat(d.Beneficiaries)});

			global.beneficiaryCount = beneficiaries;
			refreshCounts();
		}
		d3.select("#d3-map-refresh").on("click", refreshMap);



		function onlyUniqueObject(data) {
			data = data.filter(function (d, index, self) {
				return self.findIndex(function (t) {
					return t.key === d.key;
				}) === index;
			});
			return data;
		}

		function filterSelectedItem(item, c, needRemove) {
			if (needRemove) {
				global[item] = global[item].filter(function (a) {
					return a !== c;
				});
			} else {
				global[item].push(c);
			}
			global[item] = onlyUniqueObject(global[item]); //global[item].filter(onlyUnique);;
		}




		function myFilter(c, flag, needRemove) {
			if (flag === "district") {
				filterSelectedItem("selectedDistrict", c, needRemove);
			}
			if (flag === "sector") {
				filterSelectedItem("selectedSector", c, needRemove);
			}
			if (flag === "agency") {
				filterSelectedItem("selectedAgency", c, needRemove);
			}
			if (flag === "unAgency") {
				filterSelectedItem("selectedUn", c, needRemove);
			}
			if (flag === "ipAgency") {
				filterSelectedItem("selectedIp", c, needRemove);
			}
			if (flag === "opAgency") {
				filterSelectedItem("selectedOp", c, needRemove);
			}
			if (flag === "donor") {
				filterSelectedItem("selectedDonor", c, needRemove);
			}
			if (flag === "actor-type") {
				filterSelectedItem("selectedActorType", c, needRemove);
			}

			var selectedDataset = dataset.filter(function (d) { //global.selectedDataset
				var isDistrict = false; //global.selectedDistrict ? global.selectedDistrict.key === d.District : true;
				if (global.selectedDistrict.length > 0) {
					global.selectedDistrict.map(function (c) {
						if (c.key === d.Parish) {
							isDistrict = true;
						}
					});
				} else {
					isDistrict = true;
				}
				// var isSector = global.selectedSector ? global.selectedSector.values[0].Sector_ID === d.Sector_ID : true;
				var isSector = false;
				if (global.selectedSector.length > 0) {
					global.selectedSector.map(function (c) {
						console.log(d);
						if (c.values[0].Activity === d.Sector) {
							isSector = true;
						}
					});
				} else {
					isSector = true;
				}
				// var isAgency = global.selectedAgency ? global.selectedAgency.values[0].Actor_ID === d.Actor_ID : true;

				var isAgency = false;
				if (global.selectedAgency.length > 0) {
					global.selectedAgency.map(function (c) {
						if (c.values[0]["Agency name"] === d["Agency name"]) {
							isAgency = true;
						}
					});
				} else {
					isAgency = true;
				}

				var isDonor = false;
				if (global.selectedDonor.length > 0) {
					global.selectedDonor.map(function (c) {
						if (c.values[0]["Donor"] === d["Donor"]) {
							isDonor = true;
						}
					});
				} else {
					isDonor = true;
				}

				var isActorType = false;
				if (global.selectedActorType.length > 0) {
					global.selectedActorType.map(function (c) {
						if (c.values[0]["Actor type"] === d["Actor type"]) {
							isActorType = true;
						}
					});
				} else {
					isActorType = true;
				}

				return isDistrict && isSector && isAgency && isDonor && isActorType;
			});

			_selectedDataset = selectedDataset;

			domain = [+Infinity, -Infinity];

			ugandaPath.each(function (d) {
				d.properties._numberOfAgencies = 0
				selectedDataset.map(function(c) {
					if (c.Parish === d.properties.DNAME_06) {
						d.properties._numberOfAgencies = d.properties._numberOfAgencies + 1;
						domain[0] = d.properties._numberOfAgencies < domain[0] ? d.properties._numberOfAgencies :
						domain[
							0];
						domain[1] = d.properties._numberOfAgencies > domain[1] ? d.properties._numberOfAgencies :
						domain[
							1];
						color.domain(domain);
					}
				})
			})
				.style("fill", function (d) {
				return d.properties._numberOfAgencies ? color(d.properties._numberOfAgencies) : "#00000000"; //#3CB371
			});

			addLegend(domain, color);

			var selectedDatasetNest = d3.nest()
			.key(function(d){ if(d.key !== ""){ 
				return d["Agency name"]; 
			}}).entries(selectedDataset);

			var top5Values = selectedDatasetNest.sort(function(a,b){
				return b.values.length - a.values.length
			}).slice(0,5);
			updateTable(top5Values);

			beneficiaries = d3.sum(selectedDataset, function(d){console.log(d); return parseFloat(d.Beneficiaries)});

			console.log(beneficiaries);

			d3.select("#beneficiary-count").text(beneficiaries);

			var unExtract = selectedDataset.filter(function (d) {
				if (d.Actor_Type === "UN") {
					return d.Actor_Type; //return d.Actor_Type["UN"];
				}
			});
			var ipExtract = selectedDataset.filter(function (d) {
				if (d.Actor_Type === "IP") {
					return d.Actor_Type;
				}
			});
			var opExtract = selectedDataset.filter(function (d) {
				if (d.Actor_Type === "OP") {
					return d.Actor_Type;
				}
			});

			var districtList = null;
			if (flag !== "district") {
				districtList = d3.nest().key(function (d) {
					if(d.Parish !== "") {
						return d.Parish;
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}

			var sectorList = null;
			if (flag !== "sector") {
				sectorList = d3.nest().key(function (d) {
					if(d.Activity !== "") {
						return d.Activity;
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}

			var agencyList = null;
			if (flag !== "agency") {
				agencyList = d3.nest().key(function (d) {
					if(d["Agency name"] !== "") {
						return d["Agency name"];
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}
			var donorList = null;
			if (flag !== "donor") {
				donorList = d3.nest().key(function (d) {
					if(d["Donor"] !== "") {
						return d["Donor"];
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}
			var actorTypeList = null;
			if (flag !== "actor-type") {
				actorTypeList = d3.nest().key(function (d) {
					if(d["Actor type"] !== "") {
						return d["Actor type"];
					}
				}).sortKeys(d3.ascending).entries(selectedDataset);
			}
			var unAgencyList = null;
			if (flag !== "unAgency") {
				unAgencyList = d3.nest().key(function (d) {
					return d.Actor_Type; //return d.Actor_Type["UN"];
				}).sortKeys(d3.ascending).entries(unExtract);
			}

			var ipAgencyList = null;
			if (flag !== "ipAgency") {
				ipAgencyList = d3.nest().key(function (d) {
					return d.Actor_Type; //return d.Actor_Type["UN"];
				}).sortKeys(d3.ascending).entries(ipExtract);
			}

			var opAgencyList = null;
			if (flag !== "opAgency") {
				opAgencyList = d3.nest().key(function (d) {
					return d.Actor_Type; //return d.Actor_Type["UN"];
				}).sortKeys(d3.ascending).entries(opExtract);
			}

			// global.selectedDistrict = districtList;
			updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset);

			if (flag === "district") {
				d3.select("#district-count").text(global.selectedDistrict.length);
			} else {
				// global.selectedDistrict = districtList;
				d3.select("#district-count").text(districtList.length);
			}
			if (flag === "sector") {
				d3.select("#sector-count").text(global.selectedSector.length);
			} else {
				d3.select("#sector-count").text(sectorList.length);
			}
			if (flag === "agency") {
				d3.select("#agency-count").text(global.selectedAgency.length);
			} else {
				d3.select("#agency-count").text(agencyList.length);
			}
			if (flag === "unAgency") {
				d3.select("#unAgency-count").text(global.selectedUn.length);
			} else {
				d3.select("#unAgency-count").text(unAgencyList.length);
			}
			if (flag === "ipAgency") {
				d3.select("#ipAgency-count").text(global.selectedIp.length);
			} else {
				d3.select("#ipAgency-count").text(ipAgencyList.length);
			}
			if (flag === "opAgency") {
				d3.select("#opAgency-count").text(global.selectedOp.length);
			} else {
				d3.select("#opAgency-count").text(opAgencyList.length);
			}
			if (flag === "donor") {
				d3.select("#donor-count").text(global.selectedDonor.length);
			} else {
				d3.select("#donor-count").text(donorList.length);
			}
			if (flag === "actor-type") {
				d3.select("#actor-type-count").text(global.selectedActorType.length);
			} else {
				d3.select("#actor-type-count").text(actorTypeList.length);
			}



		}



		function updateLeftPanel(districtList, sectorList, agencyList, donorList, actorTypeList, dataset) {
			if (global.currentEvent !== "district") {
				districtList.map(function (a) {
					d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
					d3.select(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
				});
			}

			if (districtList) {
				d3.select("#district-count").text(districtList.length);
				var _districtList = d3.select("#district-list").selectAll("p")
				.data(districtList);
				_districtList.enter().append("p")
					.text(function (d) {
					return d.Parish;
				})
					.on("click", function (c) {
					d3.selectAll(".labels").style("opacity", opacity);
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#1fabe1");
					global.currentEvent = "district";
					myFilter(c, global.currentEvent, needRemove);

					global.selectedDistrict.map(function (a) {
						//console.log(a);
						d3.selectAll(".district-" + a.key.toLowerCase().replaceAll('[ ]', "-")).style("opacity", 1);
					});
					//console.log(global.selectedDistrict.length);
					if(global.selectedDistrict.length === 0){refreshCounts(); refreshMap();}
				});
				_districtList
					.attr("class", function (d) {
					return "district-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_districtList.exit().remove();
			}

			if (sectorList) {
				d3.select("#sector-count").text(sectorList.length);
				var _sectorList = d3.select("#sector-list").selectAll("p")
				.data(sectorList);
				_sectorList.enter().append("p")
					.attr("class", function(d){
					return d.key.replace(/\s/g,'');
				})
					.text(function (d) {
					//return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
					// d3.select(this).style("background", "#8cc4d3");
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
																			"#1fabe1");
					global.currentEvent = "sector";
					myFilter(c, global.currentEvent, needRemove);
					// myFilterBySector(c, needRemove);
					if(global.selectedSector.length === 0){refreshCounts();}
				});
				_sectorList //.transition().duration(duration)
					.attr("class", function(d){
					return d.key.replace(/\s/g,'');
				})
					.text(function (d) {
					return d.key;
				});
				_sectorList.exit().remove();
			}

			if (agencyList) {
				d3.select("#agency-count").text(agencyList.length);
				var _agencyList = d3.select("#agency-list").selectAll("p")
				.data(agencyList);
				_agencyList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" : "#1fabe1");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "agency"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedAgency.length === 0){refreshCounts();}
				});
				_agencyList
					.text(function (d) {
					return d.key;
				});
				_agencyList.exit().remove();
			}

			if (donorList) {
				d3.select("#donor-count").text(donorList.length);
				var _donorList = d3.select("#donor-list").selectAll("p")
				.data(donorList);
				_donorList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
																			"#1fabe1");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "donor"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedDonor.length === 0){refreshCounts();}
				});
				_donorList
					.text(function (d) {
					return d.key;
				});
				_donorList.exit().remove();
			}

			if (actorTypeList) {
				d3.select("#actor-type-count").text(actorTypeList.length);
				var _actorTypeList = d3.select("#actor-type-list").selectAll("p")
				.data(actorTypeList);
				_actorTypeList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				// .style("background", "transparent")
					.on("click", function (c) {
					var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
					d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
																			"#1fabe1");
					// myFilterByAgency(c, needRemove);
					global.currentEvent = "actor-type"
					myFilter(c, global.currentEvent, needRemove);
					if(global.selectedActorType.length === 0){refreshCounts();}
				});
				_actorTypeList
					.text(function (d) {
					return d.key;
				});
				_actorTypeList.exit().remove();
			}

			d3.select("#agency-list").selectAll("p").select("i").remove();

			d3.select("#agency-list").selectAll("p").append("i")
				.html("<i class=\"glyphicon glyphicon-info-sign\"></i>").on("click", function(d){
				d3.select("#agency-name").select("span")
					.remove();
				d3.select("#agency-description").select("span")
					.remove();

				var newName = d.key;
				var newDescription = d.values[0]["Detailed Activity description"];

				d3.select("#agency-name").append("span").text(newName);
				d3.select("#agency-description").append("span").text(newDescription);


			});

		}

		window.addEventListener("resize", function () {
			var wrapper = d3.select("#d3-map-wrapper");
			var width = wrapper.node().offsetWidth || 960;
			var height = wrapper.node().offsetHeight || 480;
			if (width) {
				d3.select("#d3-map-wrapper").select("svg")
					.attr("viewBox", "0 0 " + width + " " + height)
					.attr("width", width)
					.attr("height", height);
			}
		});

		d3.select("#agency-name").select("span")
			.transition()
			.duration(50)
			.text("Kampala Capital City Authority");

		d3.select("#agency-description").select("span")
			.transition()
			.duration(50)
			.text("Mission: To Deliver Quality Services to the City");



	} // ready



})(d3, $, queue, window);