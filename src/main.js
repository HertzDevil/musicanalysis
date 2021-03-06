var g_Editor = null;
var g_Song = null;
var g_Synth = null;

var g_MainTabIndex = 0;
var g_CurrentKey = null;


function main()
{
	g_Synth = new Synth();
	
	var elemSvgEditor = document.getElementById("svgEditor");
	g_Editor = new Editor(elemSvgEditor, g_Synth);
	
	g_Song = new Song();
	g_Editor.setSong(g_Song);
	g_Editor.refresh();
	
	g_Editor.callbackTogglePlay = refreshButtonPlay;
	g_Editor.callbackCursorChange = callbackCursorChange;
	
	window.onresize = function() { g_Editor.refresh(); };
	document.getElementById("inputTempo").onkeydown = function(ev) { ev.stopPropagation(); };
		
	refreshButtonPlay(false);
	refreshMainTabs();
	refreshSelectBoxes();
	callbackCursorChange(new Rational(0));
}


function refreshButtonPlay(isPlaying)
{
	var button = document.getElementById("buttonPlay");
	button.innerHTML = isPlaying ? "◼ Stop" : "► Play";
}


function refreshMainTabs()
{
	document.getElementById("tdTabFile")   .style.display = (g_MainTabIndex == 0 ? "block" : "none");
	document.getElementById("tdTabMarkers").style.display = (g_MainTabIndex == 1 ? "block" : "none");
	document.getElementById("tdTabChords") .style.display = (g_MainTabIndex == 2 ? "block" : "none");
	
	document.getElementById("buttonTabFile")   .className = (g_MainTabIndex == 0 ? "toolboxMainTabSelected" : "toolboxButton");
	document.getElementById("buttonTabMarkers").className = (g_MainTabIndex == 1 ? "toolboxMainTabSelected" : "toolboxButton");
	document.getElementById("buttonTabChords") .className = (g_MainTabIndex == 2 ? "toolboxMainTabSelected" : "toolboxButton");
}


function refreshSelectBoxes()
{
	var selectKeyPitch = document.getElementById("selectKeyPitch");
	for (var i = -8; i <= 8; i++)
	{
		var option = document.createElement("option");
		option.innerHTML = Theory.getIndependentPitchLabel(i);
		selectKeyPitch.appendChild(option);
	}
	selectKeyPitch.selectedIndex = 8;
	
	var selectKeyScale = document.getElementById("selectKeyScale");
	for (var i = 0; i < Theory.scales.length; i++)
	{
		var option = document.createElement("option");
		option.innerHTML = Theory.scales[i].name;
		selectKeyScale.appendChild(option);
	}
	
	var selectMeterNumerator = document.getElementById("selectMeterNumerator");
	for (var i = 0; i < Theory.meterNumerators.length; i++)
	{
		var option = document.createElement("option");
		option.innerHTML = Theory.meterNumerators[i].toString();
		selectMeterNumerator.appendChild(option);
	}
	selectMeterNumerator.selectedIndex = 3;
	
	var selectMeterDenominator = document.getElementById("selectMeterDenominator");
	for (var i = 0; i < Theory.meterDenominators.length; i++)
	{
		var option = document.createElement("option");
		option.innerHTML = Theory.meterDenominators[i].toString();
		selectMeterDenominator.appendChild(option);
	}
	selectMeterDenominator.selectedIndex = 2;
	
	
	var selectChordKinds = document.getElementById("selectChordKinds");
	
	var optionInKey = document.createElement("option");
	optionInKey.innerHTML = "In Key";
	selectChordKinds.appendChild(optionInKey);
	
	for (var i = 0; i < Theory.chordKinds.length; i++)
	{
		if (Theory.chordKinds[i].startGroup != undefined)
		{
			var optGroup = document.createElement("optgroup");
			optGroup.label = "-- " + Theory.chordKinds[i].startGroup + " --";
			selectChordKinds.appendChild(optGroup);
		}		
		
		var option = document.createElement("option");
		
		var labelMain = document.createElement("span");
		var labelSuperscript = document.createElement("sup");
		
		labelMain.innerHTML = Theory.getChordLabelMain(0, i, 0, []);
		labelSuperscript.innerHTML = Theory.getChordLabelSuperscript(0, i, 0, []);
		
		option.appendChild(labelMain);
		labelMain.appendChild(labelSuperscript);
		selectChordKinds.appendChild(option);
	}
	selectChordKinds.selectedIndex = 0;
}


function callbackCursorChange(tick)
{
	var keyAtTick = g_Song.keyChanges.findPrevious(tick);
	if (keyAtTick == null)
		return;
	
	g_CurrentKey = keyAtTick;
	refreshKeyDependentItems();
}


function refreshKeyDependentItems()
{
	handleSelectChordKindsChange();
}


function handleButtonPlay()
{
	g_Editor.togglePlay();
}


function handleButtonRewind()
{
	g_Editor.rewind();
}


function handleInputTempo()
{
	var input = document.getElementById("inputTempo");
	var tempo = parseInt(input.value);
	
	if (Theory.isValidBpm(tempo))
		g_Song.bpm = tempo;
}


function handleButtonInsertKeyChange()
{
	var pitch = document.getElementById("selectKeyPitch").selectedIndex - 8;
	var scaleIndex = document.getElementById("selectKeyScale").selectedIndex;
	g_Editor.insertKeyChange(scaleIndex, pitch);
}


function handleButtonInsertMeterChange()
{
	var numeratorIndex = document.getElementById("selectMeterNumerator").selectedIndex;
	var denominatorIndex = document.getElementById("selectMeterDenominator").selectedIndex;
	g_Editor.insertMeterChange(
		Theory.meterNumerators[numeratorIndex],
		Theory.meterDenominators[denominatorIndex]);
}


function handleSelectChordKindsChange()
{
	var selectedIndex = document.getElementById("selectChordKinds").selectedIndex;
	
	var tonic = g_CurrentKey.tonicPitch;
	var scale = Theory.scales[g_CurrentKey.scaleIndex];
	
	// In Key
	if (selectedIndex == 0)
	{
		for (var i = 0; i < 21; i++)
		{
			let degree = i % 7;
			let count = 3 + Math.floor(i / 7);

			var chordKindIndex = Theory.findChordKindForDegree(g_CurrentKey.scaleIndex, degree, count);
			var pitch = Theory.getPitchForScaleInterval(g_CurrentKey.scaleIndex, 0, degree);
			
			var labelMain = document.createElement("span");
			var labelSuperscript = document.createElement("sup");
			labelMain.innerHTML = Theory.getChordLabelMain(g_CurrentKey.scaleIndex, chordKindIndex, pitch, [], g_Editor.usePopularNotation);
			labelSuperscript.innerHTML = Theory.getChordLabelSuperscript(g_CurrentKey.scaleIndex, chordKindIndex, pitch, [], g_Editor.usePopularNotation);
			
			var button = document.getElementById("buttonChord" + i);
			
			while (button.firstChild != null)
				button.removeChild(button.firstChild);
			
			button.appendChild(labelMain);
			labelMain.appendChild(labelSuperscript);
			
			var degreeColor = Theory.getPitchColor(g_CurrentKey.scaleIndex, pitch, g_Editor.usePopularNotation);
			button.style.borderTop = "4px solid " + degreeColor[0];
			button.style.borderBottom = "4px solid " + degreeColor[0];
			
			button.chordKindIndex = chordKindIndex;
			button.rootPitch = pitch;
			button.onclick = function()
			{
				g_Editor.insertChord(this.chordKindIndex, this.rootPitch + g_CurrentKey.tonicPitch, []);
			};
		}
	}
	
	else
	{
		var chordKindIndex = selectedIndex - 1;
		var buttonAssignment = [		// // //
			 7,  9, 11,  6,  8, 10, 12,
			 0,  2,  4, -1,  1,  3,  5,
			-7, -5, -3, -8, -6, -4, -2,
		];
		
		for (var i = 0; i < buttonAssignment.length; i++)
		{
			var pitch = buttonAssignment[i];
			
			var labelMain = document.createElement("span");
			var labelSuperscript = document.createElement("sup");
			labelMain.innerHTML = Theory.getChordLabelMain(g_CurrentKey.scaleIndex, chordKindIndex, pitch, [], g_Editor.usePopularNotation);
			labelSuperscript.innerHTML = Theory.getChordLabelSuperscript(g_CurrentKey.scaleIndex, chordKindIndex, pitch, [], g_Editor.usePopularNotation);
			
			var button = document.getElementById("buttonChord" + i);
			
			while (button.firstChild != null)
				button.removeChild(button.firstChild);
			
			button.appendChild(labelMain);
			labelMain.appendChild(labelSuperscript);
			
			var degreeColor = Theory.getPitchColor(g_CurrentKey.scaleIndex, pitch, g_Editor.usePopularNotation);
			button.style.borderTop = "4px solid " + degreeColor[0];
			button.style.borderBottom = "4px solid " + degreeColor[0];
		
			button.style.visibility = "visible";
			
			button.chordKindIndex = chordKindIndex;
			button.rootPitch = pitch;
			button.onclick = function()
			{
				g_Editor.insertChord(this.chordKindIndex, this.rootPitch + g_CurrentKey.tonicPitch, []);
			};
		}
	}
}


function handleCheckboxPopularNotation()
{
	var usePopularNotation = document.getElementById("checkboxPopularNotation").checked;
	g_Editor.usePopularNotation = usePopularNotation;
	g_Editor.refresh();
	refreshKeyDependentItems();
}


function handleButtonLoadLocal()
{
	var data = window.prompt("Paste a saved song data:", "");
	if (data == null)
		return;
	
	try
	{
		g_Song.load(data);
	}
	catch (err)
	{
		window.alert("Error loading song data.");
		g_Song.clear();
		g_Song.sanitize();
	}
	
	document.getElementById("inputTempo").value = g_Song.bpm.toString();
	g_Editor.setSong(g_Song);
	g_Editor.cursorSetTickBoth(new Rational(0));
	g_Editor.refresh();
}


function handleButtonSaveLocal()
{
	var songData = g_Song.save();
	var data = "data:text/plain," + encodeURIComponent(songData);
	window.open(data);
}


function handleButtonLoadDropbox()
{
	Dropbox.choose({
		linkType: "direct",
		multiselect: false,
		success: function(files)
		{
			var xhr = new XMLHttpRequest();
			xhr.open("get", files[0].link, true);
			xhr.responseType = "text";
			xhr.onload = function()
			{
				if (xhr.status == 200)
				{
					try
					{
						g_Song.load(xhr.response);
					}
					catch (err)
					{
						window.alert("Error loading song data.");
						g_Song.clear();
						g_Song.sanitize();
					}
				}
				else
				{
					console.log(xhr);
					window.alert("Error loading Dropbox file.");
					g_Song.clear();
					g_Song.sanitize();
				}
				
				document.getElementById("inputTempo").value = g_Song.bpm.toString();
				g_Editor.setSong(g_Song);
				g_Editor.cursorSetTickBoth(new Rational(0));
				g_Editor.refresh();
			};
			xhr.send();
		}
	});
}


// Still not working...
function handleButtonSaveDropbox()
{
	var songData = g_Song.save();
	var data = "data:," + encodeURIComponent(songData);
	
	Dropbox.save(
		data,
		"song.txt",
		{
			success: function() { window.alert("Successfully saved file to Dropbox."); },
			error: function(msg) { window.alert("Error saving file to Dropbox.\n\nError message: " + msg); }
		});
}


// Still not working...
function handleButtonSaveAsDropbox()
{
	var filename = window.prompt("Save under what filename?", "song.txt");
	if (filename == null)
		return;
	
	var songData = g_Song.save();
	var data = "data:," + encodeURIComponent(songData);
	
	Dropbox.save(
		data,
		filename,
		{
			success: function() { window.alert("Successfully saved file to Dropbox."); },
			error: function(msg) { window.alert("Error saving file to Dropbox.\n\nError message: " + msg); }
		});
}