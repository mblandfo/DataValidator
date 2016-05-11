$(() => {

    var logger = new Logger();

    $('#runTestsBtn').click(() => {
        var testRunner = new TestRunner(logger);
        testRunner.runTests();
    });

    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').removeClass('dragging');
        logger.clear();
        var files = evt.dataTransfer.files; // FileList object.

        var f = files[0];

        getFileData(f, (csvStr) => {
            if (!csvStr.trim()) {
                logger.logFailure('no data found in file');
                return;
            }
            
            try {
                var csvData = $.csv.toObjects(csvStr);
            } catch (e) {
                logger.logFailure('Unable to read file. It should be a csv file.');    
                return;
            }

            logger.logFailure(f.name + ': read ' + csvData.length + ' rows');
            var v = new Validator(logger);
            v.validate(csvData);
        });
    }



    function getFileData(f, go) {
        var r = new FileReader();
        r.onload = function (e: any) {
            var contents = e.target.result;
            go(contents);
        }
        r.readAsText(f);
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').addClass('dragging');
        evt.dataTransfer.dropEffect = 'copy';
    }

    function handleDragLeave(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').removeClass('dragging');
    }
    
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('dragleave', handleDragLeave, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
});