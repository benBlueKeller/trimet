import React, { Component } from 'react';

import api from './get-api.js';

function AJAX(url, callback) {
  console.log(url);
  var onLoad = function() {
    return callback(JSON.parse(this.responseText));
  };
  var req = new XMLHttpRequest();
  req.addEventListener("load", onLoad);
  req.open("GET", url);
  req.send();
}

export default class Trimet extends Component {
	constructor() {
		super();
		this.state = {
			locations: [],
			matches: []
		}
	}

	componentDidMount() {
		function findMatches(loc1, loc2, arrivals) {
			var loc1Map = new Map(),
				loc2Map = new Map();
			console.log("\nLocations: \n", loc1, loc2, "\n");
			for (var a = arrivals.length - 1; a >= 0; a--) {
				let arrival = arrivals[a];
				if (arrival.locid === loc1.id) loc1Map.set(arrival.vehicleID, arrival);
				if (arrival.locid === loc2.id) loc2Map.set(arrival.vehicleID, arrival);
			}

			var matches = [];
			for (var vehicleID of loc2Map.keys()) {
				if(loc1Map.has(vehicleID)) matches.push({
					a1: loc1Map.get(vehicleID),
					a2: loc2Map.get(vehicleID)
				});
			}
			return matches
		}

		function findLocationsAndArrivals(startID = "7984", endID = "7957", callback) {
			function getUrl(locIDs = "7984", arrivals = "4", appID = api.trimet) { return "http://developer.trimet.org/ws/V2/arrivals?json=true&locIDs="+locIDs+"&appID="+appID+"&arrivals="+arrivals;}
			let url = getUrl(startID + "," + endID);
			AJAX(url, json => {
				try {
					var locations = json.resultSet.location,
						arrivals = json.resultSet.arrival;
				} catch(e) {
					var errMessage = json.resultSet.error.content;
					console.error("Trimet returned:\n  ", errMessage);
				}
				callback(locations, arrivals);
			});
		}

		
		

		findLocationsAndArrivals("7984", "7957", (locations, arrivals) => {
			this.setState({
				locations,
				matches: findMatches(locations[0], locations[1], arrivals)
			});
		});
	}

	render() {
		var matchesList = (<ul></ul>);
		if(typeof this.state.locations[1] === 'object') {
			const matches = this.state.matches;
			const loc1 = this.state.locations[0];
			const loc2 = this.state.loctions[1];
			matchesList = mapMatchesToUl(matches, loc1, loc2);
		}

		function mapMatchesToUl(matches, loc1, loc2) {
			return (
				<ul>
					{matches.map((match, index) => {
						var bus = { fullSign: match.a1.fullSign, vehicleID: match.a1.vehicleID},
							departure = { desc: loc1.desc },
							arrival = { desc: loc2.desc };
						if(match.a1.estimated) {
							departure.time = new Date(match.a1.estimated);
						} else {
							departure.time = new Date(match.a1.scheduled);
						}
						if(match.a2.estimated) {
							departure.time = new Date(match.a2.estimated);
						} else {
							departure.time = new Date(match.a2.scheduled);
						}
						return (
							<li>
								<h2>{bus.fullSign}</h2>
								<h3>{departure.desc}</h3>
								<p>{departure.time.toDateString()}</p>
								<h3>{arrival.desc}</h3>
								<p>{arrival.time.toDateString()}</p>
							</li>
						)
					})}
				</ul>
			)
		}

		return(
			<div className="trimet">
				{matchesList}
			</div>
		);
	}
}