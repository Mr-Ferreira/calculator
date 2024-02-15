let modifiedOutput = undefined
let formula = "0"
let lastOperation = ""
let loc = 1
let endloc = 1
let cursorPresent = false
let input
$(document).ready(function () {
    input = $('#display')[0]
    input.setSelectionRange(loc, endloc)
})

// Allows keyboard input to act as numpad button click.
// Enables arrow key usage.
// Deals with allowing Ctrl keybinds such as Ctrl+C and Ctrl+V
let control = false
let savedColor = new Object()
let savedBackground = new Object()
let keyDown = ""
$(document).ready(function () {
    $('[name="button"').each(function () {
        let buttonId = $(this).attr('id')
        let element = $(this)[0]
        savedBackground[buttonId] = window.getComputedStyle(element, null).getPropertyValue("background-color")
        savedColor[buttonId] = window.getComputedStyle(element, null).getPropertyValue("color")
    })

    $(document).on("keydown", function(event) {
        let trigger = event.key
        let display = $('#display').html()
        let length = display.length

        if ((trigger == "Control" || trigger == "Command") && control == false) {
            control = true
            input.blur()
            return
        }
        if (mouseDown == false && keyDown == "") {
            if ((trigger == "c" || trigger == "x") && control == true) 
                navigator.clipboard.writeText(display.slice(loc, endloc))
            else if (trigger == "ArrowLeft" || trigger== "ArrowRight") {
                if (trigger == "ArrowLeft" && endloc > 0)
                    endloc--
                else if (trigger == "ArrowRight" && endloc < length)
                    endloc++
        
                if (endloc != length)
                    cursorPresent = true
                
                loc = endloc
                input.setSelectionRange(loc, endloc)
                return
            }
            else if (trigger == "ArrowUp" || trigger== "ArrowDown") {
                let distanceFromRight = 0
                for (let i = endloc; i < length; i++) {
                    if (display[i] != "\n")
                        distanceFromRight++
                    else
                        break
                }

                if (trigger == "ArrowUp") {
                    let savedLoc = endloc - 1
                    if (savedLoc > 0) {
                        for (savedLoc; savedLoc >= 0; savedLoc--) {
                            if (display[savedLoc] == "\n")
                                break
                        }
                        if (savedLoc >= 0) {
                            while (distanceFromRight > 0) {
                                savedLoc = savedLoc - 1
                                distanceFromRight--
                            }
                            if (savedLoc < 0)
                                savedLoc = 0
                            endloc = savedLoc
                        }
                    }
                }
                else if (trigger== "ArrowDown") {
                    if (endloc < length - 1) {
                        for (endloc; endloc < length; endloc++) {
                            if (display[endloc] == "\n") {
                                endloc++
                                for (endloc; endloc < length; endloc++) {
                                    if (display[endloc] == "\n")
                                        break
                                }
                                break
                            } 
                        }
                        while (distanceFromRight > 0) {
                            endloc = endloc - 1
                            distanceFromRight--
                        }
                        if (endloc < 0)
                            endloc = 0
                    }
                }
                
                if (endloc != length)
                    cursorPresent = true

                loc = endloc
                input.setSelectionRange(loc, endloc)
                return
            }
            else if (trigger == "Shift") {
                keyDown = ""
                return
            }

            keyDown = trigger
            if (control == false) {
                trigger = triggerId(trigger)
                animate(trigger, "down")  
            }
        }
    })
    $(document).on("keyup", function(event) {
        let trigger = event.key
        if (trigger == "Control" || trigger == "Command") {
            setTimeout(() => {
                control = false
                input.focus()
            }, 100)
        }
            
        if (mouseDown == false && trigger == keyDown) {
            keyDown = ""

            trigger = triggerId(trigger)

            if (trigger == "ERROR")
                return
            
            if (trigger == "C" && control)
                return
            

            animate(trigger, "up")
            read($("#" + trigger).html())
        }
    })
    $(document).on("click", function() {
        control = false
        input.focus()
    })
    $(document).on("paste", function(event) {
        read(event.originalEvent.clipboardData.getData("text/plain"))
    })
    $(document).on("cut", function() {
        navigator.clipboard.writeText($('#display').html().slice(loc, endloc))
    })
})

// Designates the display set-up based on button input and cursor location.
let recursionRun = false
function read(event) {
    // Changes what is on the display and adjusts the cursor location based on the adjusted display
    function setScreen(string) {
        let fancyString = fancy(string)
        $('#display').html(fancyString)
        if (cursorPresent == false) {
            loc = fancyString.length
            endloc = loc
        }
        else {
            let fancyIndex = 0
            let strIndex = 0
            while (strIndex < endloc) {
                if (string[strIndex] == fancyString[fancyIndex]) {
                    strIndex++
                    fancyIndex++
                }
                else 
                    fancyIndex++
            }
            endloc = fancyIndex
            loc = fancyIndex
        }
        input.setSelectionRange(loc, endloc)
        resize()
    }

    // Resets global variables
    function reset() {
        modifiedOutput = undefined
        formula = "0"
        lastOperation = ""
        display.style.fontSize = "30px"
        cursorPresent = false
        setScreen(formula)
        $('#answerDisplay').html("= ") 
    }

    // Calculates the parsed formula.
    // Recall - PEMDAS.
    function calculate (formula) {
        // Limits size of calculated numbers to 10 digits after the decimal,
        // this is due to Javascript's floating point number innaccuracy.
        // Limits size of calculated numbers to 15 digits total.
        function precision(num) {
            if (num == "0")
                return num

            // Counts number of digits after the decimal
            let dec = false
            let decDigitCount = 0
            let nonZeroDecDigitCount = 0
            let nonZeroIndex = -1
            let tempNum = ""
            let decIndex = -1
            let eIndex = -1
            let length = num.length

            for (let i = 0; i < length; i++) {
                if (num[i] == ".") {
                    dec = true
                    decIndex = i
                    continue
                }
                if (num[i] == "e") {
                    eIndex = i
                    if (dec == false)
                        return num
                    dec = false
                }
                if (dec) {
                    decDigitCount++
                    if (num[i] != "0" && nonZeroIndex == -1) 
                        nonZeroIndex = i
                    if (nonZeroIndex != -1 && eIndex == -1)
                        nonZeroDecDigitCount++
                }
                if (decDigitCount == 11 && dec) {
                    if ((i + 1) > (length - 1)) 
                        tempNum = num
                    else
                        tempNum = num.slice(0, i + 1)
                }
            }

            let eQuantity = ""
            if (eIndex != -1)
                eQuantity = num.slice(eIndex)
            
            if (tempNum != "") {
                if (Number(tempNum[tempNum.length - 1]) > 4){
                    let newVal = tempNum.slice(nonZeroIndex)
                    let preRoundLen = 0
                    let postRoundLen = 0
                    tempNum = tempNum.slice(0, (decIndex + 1))
                    
                    preRoundLen = newVal.length
                    newVal = Number(newVal) + 1
                    newVal = newVal.toString()
                    postRoundLen = newVal.length
            
                    
                    if (newVal.length > 11) {
                        newVal = ""
                        if (tempNum[0] == "-")
                            tempNum = Number(tempNum) - 1
                        else
                            tempNum = Number(tempNum) + 1
                        tempNum = tempNum.toString()
                    }
                    else if (postRoundLen > preRoundLen) {
                        for (let i = 0; i < (decDigitCount - nonZeroDecDigitCount - 1); i++)
                            tempNum = tempNum + "0"
                    }
                    else {
                        for (let i = 0; i < (decDigitCount - nonZeroDecDigitCount); i++)
                            tempNum = tempNum + "0"
                    }
                    num = tempNum + newVal + eQuantity
                }   
                else 
                    num = tempNum.slice(0, (tempNum.length - 1)) + eQuantity
            }

            let digitCount = 0
            let fifteenIndex = -1
            let sixteenIndex = -1
            length = num.length
            for (let i = 0; i < length; i++) {
                if (!isNaN(Number(num[i]))) {
                    digitCount++
                    if (digitCount == 15) 
                        fifteenIndex = i
                    else if (digitCount == 16)
                        sixteenIndex = i
                }
            }

            if (decIndex != -1 && digitCount > 15 && eIndex == -1) {
                if (decIndex < fifteenIndex) {
                    if (Number(num[sixteenIndex]) > 4) {
                        let newVal = num.slice(nonZeroIndex, fifteenIndex + 1)
                        let preRoundLen = 0
                        let postRoundLen = 0
                        let intNum = num.slice(0, (decIndex + 1))
                        
                        preRoundLen = newVal.length
                        newVal = Number(newVal) + 1
                        newVal = newVal.toString()
                        postRoundLen = newVal.length
                
                        
                        if (newVal.length > (fifteenIndex - decIndex)) {
                            newVal = ""
                            if (intNum[0] == "-")
                                intNum = Number(intNum) - 1
                            else
                                intNum = Number(intNum) + 1
                            intNum = intNum.toString()
                        }
                        else if (postRoundLen > preRoundLen) {
                            for (let i = 0; i < (decDigitCount - nonZeroDecDigitCount - 1); i++)
                                intNum = intNum + "0"
                        }
                        else {
                            for (let i = 0; i < (decDigitCount - nonZeroDecDigitCount); i++)
                                intNum = intNum + "0"
                        }
                        num = intNum + newVal
                    }
                    else
                        num = num.slice(0, fifteenIndex + 1)
                    digitCount = 15
                }
                else {
                    if (decIndex != length - 1) {
                        if (Number(num[decIndex + 1]) > 4) {
                            if (num[0] == "-")
                                num = Number(num.slice(0, decIndex)) - 1
                            else 
                                num = Number(num.slice(0, decIndex)) + 1
                        }
                        else
                            num = num.slice(0, decIndex)
                    }
                    else
                        num = num.slice(0, decIndex)
                    digitCount = decIndex
                }
                num = num.toString()  
            }

            if (digitCount > 15 && eIndex == -1) {
                let negSign = false
                if (num[0] == "-") {
                    negSign = true
                    num = num.slice(1)
                }
                num = num.slice(0, 10)
                if (num[9] > 4) 
                    num = Number(num.slice(0, 9)) + 1
                else 
                    num = Number(num.slice(0, 9))
                num = num.toString()
                num = num.slice(0, 1) + "." + num.slice(1) + "e+" + (digitCount - 1).toString()
                if (negSign == true)
                    num = "-" + num
            }
            return num
        }

        let length = formula.length
        let calculation = 0
        if (formula == "ERROR")
            return "ERROR"
        // Solve parentheses using recursion.
        let parenthesesSize = 0
        for (let i = 0; i < length; i++) {
            if (formula[i] == "(") {
                let openCount = 1
                let closedCount = 0
                for (let j = i + 1; j < length; j++) {
                    if (formula[j] == "(")
                        openCount++
                    else if (formula[j] == ")")
                        closedCount++
                    if (openCount == closedCount)  {
                        parenthesesSize = (j - i) + 1
                        let localCalc = 0
                        localCalc = calculate(formula.slice((i + 1), j))
                        if (localCalc == "ERROR")
                            return "ERROR"
                        formula.splice(i, parenthesesSize, localCalc)
                        length = formula.length
                        break
                    }
                }
            }
        }

        // Solve multiplications and divisions.
        for (let i = 0; i < length; i++) {
            if ((formula[i] == "*" || formula[i] == "/") && i != (length - 1)) {
                let localCalc = 0
                let num1 = Number(precision(formula[i - 1]))
                let num2 = Number(precision(formula[i + 1]))
                if (formula[i] == "*")
                    localCalc = num1 * num2
                else {
                    if (num2 == 0)
                        return "ERROR"
                    else
                        localCalc = num1 / num2
                }
                localCalc = precision(localCalc.toString())
                formula.splice(i - 1, 3, localCalc)
                length = formula.length
                i = i - 1
            }
        }

        // Solve additions and subtractions.
        let sum = false
        let sub = false
        for (let i = 0; i < length; i++) {
            let num = Number(precision(formula[i]))
            if (!isNaN(num)) {
                if (sum || i == 0) {
                    calculation = calculation + num
                    sum = false
                }
                else if (sub) {
                    calculation = calculation - num
                    sub = false
                }
                calculation = Number(precision(calculation.toString()))
            }
            else if (formula[i] == "+") 
                sum = true
            else if (formula[i] == "-") 
                sub = true
        }
        return precision(calculation.toString())
    }

    let completedFormula = "0" // Global variable that holds the parsed formula with completed paratheses
    // Parses the formula to be later solved.
    function parse (formula) {
        let parsedFormula = [""]
        let parsedFormulaIndex = 0

        function next() {
            if (parsedFormula[parsedFormulaIndex] != "") {
                parsedFormula.push("")
                parsedFormulaIndex++
            }
        }

        let parsedFormulaLen = parsedFormula.length
        let length = formula.length
        for (let i = 0; i < length; i++) {
            if (typeId(formula[i]) == 1) {
                if (formula[i] == "%") {
                    let percentageOfFormula = ""
                    let percentageOperatorIndex = -1
                    let closedCount = 0
                    for (let j = i - 1; j >= 0; j--) {
                        if (j == (i - 1) && formula[j] == ")") {
                            percentageOperatorIndex = "pendingOpen"
                            closedCount++
                            continue
                        } 
                        if (percentageOperatorIndex == "pendingOpen"){
                            if (closedCount == 0)
                                percentageOperatorIndex = -1
                            else if ((formula[j] == "(" && closedCount > 0))
                                closedCount--
                            else if (formula[j] == ")")
                                closedCount++
                        }
                        if (percentageOperatorIndex != "pendingOpen"){
                            if (typeId(formula[j]) == 0 && percentageOperatorIndex == -1) {
                                if (j > 0) {
                                    if (formula[j - 1] == "e")
                                        continue
                                }
                                if (formula[j] == "+" || formula[j] == "-") {
                                    percentageOperatorIndex = j
                                    if (formula[j] == "-" && j > 0){
                                        if (formula[j - 1] == "(")
                                            percentageOperatorIndex = -1
                                    }
                                }    
                                else {
                                    percentageOperatorIndex = -1
                                    break
                                }    
                            }
                            else if (formula[j] == "(" && closedCount == 0)
                                break
                            else if ((formula[j] == "(" && closedCount > 0))
                                closedCount--
                            else if (formula[j] == ")")
                                closedCount++
                            if (percentageOperatorIndex != -1 && percentageOperatorIndex > j)
                                percentageOfFormula = formula[j] + percentageOfFormula
                        }
                    }
                    if (percentageOperatorIndex == "pendingOpen")
                        percentageOperatorIndex = -1
                    if (i < length - 1) {
                        if (formula[i + 1] == "×" || formula[i + 1] == "÷")
                            percentageOfFormula = ""
                    }
                    if (percentageOfFormula != "")
                        percentageOfFormula = calculate(parse(percentageOfFormula))
                    next()
                    if (parsedFormula[parsedFormulaIndex - 1] == ")") {
                        parsedFormulaLen = parsedFormula.length
                        let closedCount = 0
                        let openIndex = -1
                        for (let j = parsedFormulaLen - 1; j >= 0; j--) {
                            if (parsedFormula[j] == ")")
                                closedCount++
                            else if (parsedFormula[j] == "(" && closedCount == 1) 
                                openIndex = j
                            else if (parsedFormula[j] == "(") 
                                closedCount--
                        }
                        parsedFormula.splice(openIndex, 0, "(")
                        parsedFormulaIndex++
                    }
                    else {
                        next()
                        parsedFormula[parsedFormulaIndex] = parsedFormula[parsedFormulaIndex - 1]
                        parsedFormula[parsedFormulaIndex - 1] = "("
                        next()
                    }
                    parsedFormula[parsedFormulaIndex] = "/"
                    next()
                    parsedFormula[parsedFormulaIndex] = "100"
                    next()
                    parsedFormula[parsedFormulaIndex] = ")"
                    if (percentageOfFormula != "" && percentageOfFormula != "ERROR") {
                        next()
                        parsedFormula[parsedFormulaIndex] = "*"
                        next()
                        parsedFormula[parsedFormulaIndex] = percentageOfFormula
                    }
                }
                else if (formula[i] == "e") {
                    if (formula[i + 1] == "-")
                        parsedFormula[parsedFormulaIndex] = parsedFormula[parsedFormulaIndex] + "e-" + formula[i + 2]
                    else
                        parsedFormula[parsedFormulaIndex] = parsedFormula[parsedFormulaIndex] + "e" + formula[i + 1] + formula[i + 2]
                    i+=2
                }
                else if ((typeId(parsedFormula[parsedFormulaIndex]) == 1))
                    parsedFormula[parsedFormulaIndex] = parsedFormula[parsedFormulaIndex] + formula[i]
                else {
                    next()
                    parsedFormula[parsedFormulaIndex] = parsedFormula[parsedFormulaIndex] + formula[i]
                }
            } 
            else {
                next()
                if (formula[i] == "×" && i < (length - 1))
                    parsedFormula[parsedFormulaIndex] = "*"
                else if (formula[i] == "+" && i < (length - 1)) 
                    parsedFormula[parsedFormulaIndex] = "+"
                else if (formula[i] == "-" && i < (length - 1)) 
                    parsedFormula[parsedFormulaIndex] = "-"
                else if (formula[i] == "÷" && i < (length - 1))
                    parsedFormula[parsedFormulaIndex] = "/"
                else if (formula[i] == "(" && i < (length - 1)) 
                    parsedFormula[parsedFormulaIndex] = "("
                else if (formula[i] == ")") 
                    parsedFormula[parsedFormulaIndex] = ")"
                else if (i == (length - 1)) 
                    return "ERROR"
            } 
        }

        let sumLeft = 0
        let sumRight = 0
        parsedFormulaLen = parsedFormula.length
        for (let i = 0; i < parsedFormulaLen; i++) {
            if (parsedFormula[i] == "(")
                sumLeft++
            else if (parsedFormula[i] == ")")
                sumRight++
        }
        completedFormula = formula
        while (sumLeft > sumRight) {
            next()
            completedFormula = completedFormula + ")"
            parsedFormula[parsedFormulaIndex] = ")"
            sumRight++
        }

        return parsedFormula
    }

    // Adds commas for every 3 integer digits, adds/removes line breaks
    function fancy (formula) {
        let length = formula.length
        if (formula == "ERROR" || formula == "Infinity" || formula == "-Infinity")
            return formula
        
        // adds commas
        length = formula.length
        let intNums = ""
        let fancyFormula = ""
        for (let i = 0; i < length; i++) {
            if (!isNaN(Number(formula[i])))
                intNums = intNums + formula[i]
            if (typeId(formula[i]) == 0 || formula[i] == "%" || typeId(formula[i]) == 2|| i == length - 1 || formula[i] == "." || formula[i] == "e") {
                let intNumsLen = intNums.length
                let fancy = ""
                for (let k = intNumsLen - 4; k >= 0; k = k - 3) {
                    if (k == intNumsLen - 4)
                        fancy = "," + intNums.slice(k + 1) + fancy
                    else
                        fancy = "," + intNums.slice(k + 1, k + 4) + fancy
                }
                    
                if (intNumsLen % 3 == 2) 
                    fancy = intNums.slice(0, 2) + fancy
                if (intNumsLen % 3 == 1)
                    fancy = intNums[0] + fancy
                if (intNumsLen % 3 == 0)
                    fancy = intNums.slice(0, 3) + fancy

                let end = ""
                let j = i
                let savedIndex = -1
                if (formula[j] == ".") {
                    while (j < length && typeId(formula[j]) != 0 && formula[j] != "%" && typeId(formula[j]) != 2 && formula[j] != "e") {
                        end = end + formula[j]
                        savedIndex = j
                        j++
                    }
                }
                while (j < length && isNaN(Number(formula[j]))) {
                    end = end + formula[j]
                    savedIndex = j
                    j++
                }
                if (savedIndex != -1)
                    i = savedIndex 

                fancyFormula = fancyFormula + fancy + end
                intNums = ""
            }
        }
        formula = fancyFormula

        // adds line breaks
        length = formula.length
        let unbrokenChars = 0
        for (let i = 0; i < length; i++) {
            if (formula[i] != "\n")
                unbrokenChars++
            else
                unbrokenChars = 0

            if (unbrokenChars > 22) {
                for (let j = i; j >= 0; j--) {
                    if (typeId(formula[j]) == 0 || formula[j] == "(" || formula[j] == ")") {
                        if (typeId(formula[j]) == 0 && j > 0) {
                            if (formula[j - 1] == "e")
                                continue
                        }
                        if (j != 0) {
                            if (formula[j - 1] != "\n") {
                                formula = formula.slice(0, j) + "\n" + formula.slice(j)
                                i--
                                length++
                                unbrokenChars = 0
                            }
                        }
                        break
                    }
                }
            }
        }

        // removes unecessary line breaks
        length = formula.length
        for (let i = 0; i < length; i++) {
            if (formula[i] == "\n") {
                let leftChars = 0
                let rightChars = 0
                for (let j = i; j < length; j++) {
                    if (formula[j] == "\n" && j != i) 
                        break
                    else if (j != i)
                        rightChars++
                }
                for (let k = i; k >= 0; k--) {
                    if (formula[k] == "\n" && k != i) 
                        break
                    else if (k != i)
                        leftChars++
                }
                if (leftChars + rightChars <= 22) {
                    if (i == length - 1)
                        formula = formula.slice(0, i)
                    else if (i == 0)
                        formula = formula.slice(i + 1)
                    else 
                        formula = formula.slice(0, i) + formula.slice(i + 1)
                }
            }
        }

        return formula
    }

    // Checks if an operation exists and returns a boolean
    function operationPresent (formula){
        let operationPresence = false
        let length = formula.length
        for (let i = 0; i < length; i++) {
            if (formula[i] == "e") {
                i++
                continue
            }
            if (typeId(formula[i]) == 0 && i > 0 && i < length - 1) {
                if ((typeId(formula[i + 1]) == 1 || formula[i + 1] == "(") && 
                (typeId(formula[i - 1]) == 1 || formula[i - 1] == ")"))
                    operationPresence = true
            }  
            else if (formula[i] == "%")
                operationPresence = true
            if (operationPresence)
                break
        }
        return operationPresence
    }

    // Automatically shows a preview of the current calculation being typed
    function preCalc (formula) {
        let length = formula.length
        if (formula == "=") 
            formula = ""
        if (operationPresent(formula)) {
            let nonFancy = ""
            for (let i = 0; i < length; i++) {
                if (formula[i] != "," && formula[i] != "\n" && formula[i] != " " && formula[i] != "<" && formula[i] != "b" && formula[i] != "r" && formula[i] != ">") 
                    nonFancy = nonFancy + formula[i]  
            }
            formula = nonFancy
            formula = calculate(parse(formula))
            if (formula == "ERROR")
                formula = ""
        }
        else
            formula = ""
        $('#answerDisplay').html("= " + fancy(formula))
    }

    let trigger = ""
    let pastedTrigger = false
    if (event.target == undefined) 
        trigger = event
    else 
        trigger = event.target.innerHTML

    let triggerLen = trigger.length
    if (trigger == "," || trigger == "\n" || trigger == "\r" || trigger == " ")
        return 0
    if (trigger == "( )")
        trigger = "p"
    else if (trigger == "+/-")
        trigger = "z"
    else if (triggerLen > 1) {
        pastedTrigger = true
        let nonfancyTrigger = ""
        for (let i = 0; i < triggerLen; i++) {
            if (trigger[i] == "," || trigger[i] == "\n" || formula[i] == "\r" || 
            trigger[i] == " " || trigger[i] == "<" || trigger[i] == "b" || trigger[i] == "r" || trigger[i] == ">")
                continue
            else
                nonfancyTrigger = nonfancyTrigger + trigger[i]
        }
        trigger = nonfancyTrigger
    }
    
    formula = $('#display').html()
    let length = formula.length
    let originalEndloc = endloc
    let originalLoc = loc
    
    let nonFancyEndloc = endloc
    let nonFancyLoc = loc
    let nonFancy = ""
    if (recursionRun) {
        nonFancyEndloc = length
        nonFancyLoc = length
    }
    else {
        // Removes 'fancy' syntax such as commas and linebreaks from the formula while adjusting endloc and loc respectively.
        // We want to remove fancy syntax for all operational uses of the formula, while using the fancy syntax on the user interface.
        for (let i = 0; i < length; i++) {
            if (formula[i] == "," || formula[i] == "\n" || formula[i] == "\r" || 
            formula[i] == " " || formula[i] == "<" || formula[i] == "b" || formula[i] == "r" || formula[i] == ">") {
                if ((formula[i] == "," || formula[i] == "\n" || formula[i] == "\r" || formula[i] == " " || formula[i] == "<") && i < originalEndloc)
                    nonFancyEndloc--
                if ((formula[i] == "," || formula[i] == "\n" || formula[i] == "\r" || formula[i] == " " || formula[i] == "<") && i < originalLoc) 
                    nonFancyLoc--
                continue
            }
            else
                nonFancy = nonFancy + formula[i]
        }
        formula = nonFancy
        length = formula.length
    }
    let preFormula = formula

    if (nonFancyLoc == length)
        cursorPresent = false

    if (trigger != "=" && modifiedOutput == false)
        modifiedOutput = true
    else if (trigger != "=" && modifiedOutput == true)
        modifiedOutput = undefined

    if (trigger == "C") {
        reset()
        return 0
    }
    else if (formula == "ERROR" || formula == "Infinity" || formula == "-Infinity") 
        return 1
    else if (trigger == "=") {
        length = formula.length
        let operationPresence = operationPresent(formula)
        if (operationPresence) {
            modifiedOutput = false
            lastOperation = formula
        }
        if (operationPresence == false && modifiedOutput == false) {
            let lastOperationLen = lastOperation.length
            let closedCount = 0
            for (let i = lastOperationLen - 1; i > 0; i--) {
                if (lastOperation[lastOperationLen - 1] == ")" || lastOperation.slice(lastOperationLen - 2) == ")%") {
                    if (lastOperation[i] == ")")
                        closedCount++
                    else if (lastOperation[i] == "(")
                        closedCount--
                    if (typeId(lastOperation[i]) == 0 && lastOperation[i - 1] != "e" && closedCount == 0) {
                        lastOperation = lastOperation.slice(i)
                        break
                    }
                }
                else if (typeId(lastOperation[i]) == 0 && lastOperation[i - 1] != "e") {
                    lastOperation = lastOperation.slice(i)
                    break
                }
            }
            let testFormula = formula + lastOperation
            if (testFormula.length > 22)
                testFormula = formula + "\n" + lastOperation
            formula = testFormula
            operationPresence = true
        }
        let preFormula
        let postFormula
        if (operationPresence || formula[length - 1] == "%") {
            formula = calculate(parse(formula))
            preFormula = completedFormula
            postFormula = formula
            length = formula.length
            loc = length
            endloc = loc
            input.setSelectionRange(loc, endloc)
        }
        else
            return 1
        if (preFormula != postFormula && formula != "ERROR") {
            let historyIndex = $('#listContainer').children().length - 2
            let lastHistOperation = ""
            if (historyIndex >= 0)
                lastHistOperation = $('#listContainer').children().eq(historyIndex).children().first().html()
            if (lastHistOperation != preFormula) {
                // Adds calculations to history container
                function appendHistory (string) {
                    let text
                    let list = $("<li></li>")
                    let button = $("<button name='button' id='histButton" + histCount + 
                    "' type='button' onclick='calcHistory(event)' style='font-size: 20px;width: 100%;height: 100%;border-radius: 0%;'></button>")
                    let container = $('#listContainer')

                    let stringLen = string.length
                    let startOfChunk = 0
                    for (let i = 0; i < stringLen; i++) {
                        if (string[i] == "\n" && i < stringLen - 1) {
                            text = document.createTextNode(string.slice(startOfChunk, i))
                            startOfChunk = i + 1
                            button.append(text)
                            button.append($("<br>"))
                        } 
                    }
                    text = document.createTextNode(string.slice(startOfChunk))
                    button.append(text)
                    list.append(button)
                    container.append(list)
                    let id = "histButton" + histCount
                    let element = container.children().last().children().first()[0]
                    savedBackground[id] = window.getComputedStyle(element, null).getPropertyValue("background-color")
                    savedColor[id] = window.getComputedStyle(element, null).getPropertyValue("color")
                    histCount++
                }
                appendHistory(fancy(preFormula))
                appendHistory("= " + fancy(postFormula))
            }
        }
    }
    else if (nonFancyLoc != length || pastedTrigger) {
        let lastFormula = formula
        let reverseIndex = lastFormula.length - nonFancyEndloc
        let savedLoc = endloc

        let potentialFormula = "0" 
        if (nonFancyLoc != nonFancyEndloc) {
            if (trigger == "⌫")
                trigger = ""

            if (nonFancyLoc == 0) 
                potentialFormula = trigger + lastFormula.slice(nonFancyEndloc)
            else 
                potentialFormula = lastFormula.slice(0, nonFancyLoc) + trigger + lastFormula.slice(nonFancyEndloc)
        }
        else {
            if (nonFancyLoc == 0) 
                potentialFormula = trigger + lastFormula.slice(0)
            else
                potentialFormula = lastFormula.slice(0, nonFancyLoc) + trigger + lastFormula.slice(nonFancyLoc)
        }
        let potentialFormulaLen = potentialFormula.length
        reset()
        
        for (let i = 0; i < potentialFormulaLen; i++) {
            recursionRun = true
            let run
            if (i < potentialFormulaLen - 1) {
                if (potentialFormula[i] == "e" && (potentialFormula[i + 1] == "+" || potentialFormula[i + 1] == "-")) {
                    $('#display').html($('#display').html() + potentialFormula[i] + potentialFormula[i + 1])
                    i++
                    continue
                }
            }

            run = read(potentialFormula[i])
            if (run == 1 && potentialFormula[i] == "0" && trigger == "⌫") 
                continue
            else if (run == 1) {
                recursionRun = false
                $('#display').html(fancy(lastFormula)) 
                loc = savedLoc
                endloc = savedLoc
                input.setSelectionRange(loc, endloc)
                preCalc($('#display').html())
                resize()
                return 1
            }
        }
        recursionRun = false
        cursorPresent = true
        let display = $('#display').html()
        endloc = display.length - reverseIndex
        loc = endloc
        setScreen(display)
        preCalc(display)
        return 0
    }
    else if (trigger == "⌫") {
        if (formula == "ERROR" || formula == "Infinity" || formula == "-Infinity") {
            reset()
            return 0
        }
        else {
            formula = formula.slice(0, (length - 1))
            formula = formula
            if (formula == "") {
                reset()
                return 0
            }
        }
    }
    else if (trigger == "z") {
        if (formula[length - 1] == "e") 
                return 1
        if (length - 2 >= 0 && typeId(formula[length - 1]) == 0) {
            if (formula[length - 2] == "e")
                return 1
        }
        if (formula == "0")
            formula = "(-"
        else if (formula == "(-")
            formula = "0"
        else {
            for (let i = length - 1; i >= 0; i--) {
                if (typeId(formula[i]) == 1 && i > 0) {
                    if (formula[i] == "%") 
                        formula = formula + "×(-"
                    else
                        continue
                }
                else if (typeId(formula[i]) == 1)
                    formula = "(-" + formula
                else if (i == (length - 1)){
                    if (formula[i] == ")") 
                        formula = formula + "×(-"
                    else if (formula[i] == "-" && i > 0) {
                        if (formula[i - 1] == "(")
                            formula = formula.slice(0, (i - 1))
                        else
                            formula = formula + "(-"
                    }
                    else
                        formula = formula + "(-"
                }
                else if (formula[i] == "-" && i > 0) {
                    if (formula[i - 1] == "e")
                            continue
                    else if (formula[i - 1] == "(")
                        formula = formula.slice(0, (i - 1)) + formula.slice(i + 1)
                    else
                        formula = formula.slice(0, (i + 1)) + "(-" + formula.slice(i + 1)
                }
                else {
                    if (i - 1 >= 0) {
                        if (formula[i - 1] == "e")
                            continue
                    }
                    formula = formula.slice(0, (i + 1)) + "(-" + formula.slice(i + 1)
                } 
                break
            }
        }
    }
    else if (trigger == "p" || trigger == "(" || trigger == ")") {
        if (formula[length - 1] == "e") 
            return 1
        if (length - 2 >= 0 && typeId(formula[length - 1]) == 0) {
            if (formula[length - 2] == "e")
                return 1
        }
        let sumLeft = 0
        let sumRight = 0

        
        for (let i = 0; i < length; i++) {
            if (formula[i] == "(")
                sumLeft++
            else if (formula[i] == ")")
                sumRight++
        }

        if (formula == "0") 
            formula = "("
        else if (trigger == "p" || trigger == ")") {
            if (typeId(formula[length - 1]) != 0 && sumLeft == sumRight && trigger != ")")
                formula = formula + "×("
            else if (typeId(formula[length - 1]) == 0 && sumLeft == sumRight)
                formula = formula + "("
            else if (typeId(formula[length - 1]) == 1 && sumLeft > sumRight)
                formula = formula + ")"
            else if (typeId(formula[length - 1]) == 2) {
                if (formula[length - 1] == ")" && sumLeft > sumRight)
                    formula = formula + ")"
                else if (formula[length - 1] == ")" && sumLeft == sumRight)
                    formula = formula + "×("
                else
                    formula = formula + "("
            }
            else if (typeId(formula[length - 1]) == 0) {
                formula = formula + "("
            }  
        }
        else if (trigger == "(") {
            if (typeId(formula[length - 1]) == 1) 
                formula = formula + "×("
            else if (formula[length - 1] == ")")
                return 1
            else
                formula = formula + "("
        }
    }
    else if (trigger == "%") {
        if (formula != "0" && typeId(formula[length - 1]) != 0 && formula[length - 1] != "e" && formula[length - 1] != "%" && formula[length - 1] != "(")
            formula = formula + "%"
    }
    else if (trigger == ".") {
        if (modifiedOutput == true)
            reset()
        if (typeId(formula[length - 1]) == 1 && formula[length - 1] != "%") {
            let digitCount = 0
            for (let i = length - 1; i >= 0; i--) {
                if (typeId(formula[i]) == 1 && formula[i] != ".")
                    digitCount++

                if (formula[i] == ".")
                    break
                else if (typeId(formula[i]) == 1 && i == 0 && digitCount < 15)
                    formula = formula + "."
                else if (typeId(formula[i]) == 1)
                    continue
                else {
                    if (i > 0) {
                        if (formula[i - 1] == "e")
                            break
                    }
                    formula = formula + "."
                    break
                }
            }
        }
        else if (typeId(formula[length - 1]) == 0 || formula[length - 1] == "(") {
            if (length - 1 > 0) {
                if (formula[length - 2] == "e")
                    return 1
            }
            formula = formula + "0."
        }
        else if (formula[length - 1] == ")" || formula[length - 1] == "%")
            formula = formula + "×0."
        else if (formula[length - 1] != ".")
            formula = formula + "."
    }
    else if (typeId(trigger) == 0) {
        if (formula != "0" && formula != "-" && formula[length - 1] != "e") {
            if (formula[length - 1] == "(" && trigger == "-") 
                formula = formula + trigger
            else if (typeId(formula[length - 1]) == 0) {
                if ((trigger == "+" || trigger == "-") && formula[length - 2] == "(") {
                    if (trigger == "+" && formula[length - 1] == "-")
                        formula = formula.slice(0, (length - 1))
                    else
                        formula = formula.slice(0, (length - 1)) + trigger
                }
                else if (trigger == "+" || trigger == "-")
                    formula = formula.slice(0, (length - 1)) + trigger
                else if ((trigger == "÷" || trigger == "×") && formula[length - 2] != "(" && formula[length - 2] != "e")
                    formula = formula.slice(0, (length - 1)) + trigger
            }
            else {
                if (formula[length - 1] == "(")
                    return 1
                else
                    formula = formula + trigger
            } 
        }
        else if (formula == "0" && trigger == "-")
            formula = "-"
    }
    else if (typeId(trigger) == 1){
        if (formula[length - 1] == "e") 
                return 1
        if (modifiedOutput == true)
            reset()
        if (length > 1 && (formula[length - 1] == "%" || formula[length - 1] == ")")) 
            formula = formula + "×" + trigger
        else if (formula == "0" || formula == "ERROR")
            formula = trigger
        else if (typeId(formula[length - 1]) == 0 && trigger == "0")
            formula = formula + trigger
        else {
            let naturalNumOrDecimal = false
            for (let i = length - 1; i >= 0; i--) {
                if (formula[i] == "." || Number(formula[i]) > 0){
                    naturalNumOrDecimal = true
                    break
                }
                if (typeId(formula[i]) == 0 || typeId(formula[i]) == 2)
                    break
            }

            if (trigger == "0" && naturalNumOrDecimal == false && formula[length - 1] == "0")
                return 1
            else if (naturalNumOrDecimal == false && formula[length - 1] == "0")
                formula = formula.slice(0, length - 1) + trigger
            else {
                // Counts the digits in the last number in the formula
                let digitCount = 0
                let decDigitCount = 0
                // eDigitCount set to -1 to offset cases where e is the last element in the formula
                let eDigitCount = -1
                for (let i = length - 1; i >= 0; i--) {
                    if (typeId(formula[i]) == 0) {
                        if (i > 0) {
                            if (formula[i - 1] != "e")
                                break
                            else {
                                i--
                                eDigitCount = digitCount
                                continue
                            }
                        }
                        else
                            break
                    }  
                    else if (formula[i] == "." && eDigitCount == -1) {
                        decDigitCount = digitCount
                        continue
                    }
                    if (typeId(formula[i]) == 1 && formula[i] != ".")
                        digitCount++
                    if (decDigitCount >= 10 || digitCount >= 15 || eDigitCount >= 3)
                        return 1
                }
                if (length > 1 && formula[length - 1] == "0" && typeId(formula[length - 2]) == 0 && trigger == "0")
                    return 1
                else if (length > 1 && formula[length - 1] == "0" && typeId(formula[length - 2]) == 0 && trigger != "0")
                    formula = formula.slice(0, length - 1) + trigger
                else if (digitCount < 15 && decDigitCount < 10 && eDigitCount < 3)
                    formula = formula + trigger
            }
        }
    }
    
    let postFormula = formula
    length = formula.length
    if (recursionRun) {
        $('#display').html(formula)
        loc = length
        endloc = length
        input.setSelectionRange(loc, endloc)
    }
    else
        setScreen(formula)

    let errorCode = 0
    if (preFormula == postFormula && trigger != "⌫" && trigger != "C" && trigger != "0")
        return 1
    else
        errorCode = 0
    
    if (recursionRun == false) {
        if (trigger == "=" || trigger == "C" || formula == "0")
            preCalc("=")
        else
            preCalc(formula)
        $('#display')[0].scrollTop = display.scrollHeight
    }
    return errorCode
}

// Gets cursor location when display is clicked on
function focused() {
    cursorPresent = true
    $(document).on("mouseup", function() {
        loc = input.selectionStart
        endloc = input.selectionEnd
    })
}

// Resizes the font based on content width
function resize() {
    let display = $('#display')[0]
    let fontSize = 30
    display.style.fontSize = "30px"
    while (display.scrollWidth > display.clientWidth) {
        fontSize--
        if (fontSize < 20)
            return
        display.style.fontSize = fontSize.toString() + "px"
    }
}

// History container button functionalities
let histCount = 0
function calcHistory(event) {
    let trigger = event.target.innerHTML
    if (keyDown == "") {
        if (trigger == "Hist") {
            $('#histContainer')[0].style.display = "block"
            let histList = $('#listContainer')[0]
            histList.scrollTop = histList.scrollHeight
            $('#numPad')[0].style.display = "none"
            $('#showHistory').html("123")
        }
        else if (trigger == "123") {
            $('#histContainer')[0].style.display = "none"
            $('#numPad')[0].style.display = "block"
            $('#showHistory').html("Hist")
        }
        else if (trigger == "Clear") {
            $('#listContainer').children().each(function () {
                $('#listContainer').children().last().remove()
            })
            histCount = 0
        }  
        else {
            if (trigger[0] == "=")
                trigger = trigger.slice(1)
            read(trigger)
        }
    }
}

// Translates raw keyboard/mouse input events into HTML DOM Ids
function triggerId(trigger) {
    let id = trigger
    if (trigger == "(" || trigger == ")" || trigger == "parentheses")
        id = "parentheses"
    else if (trigger == "*" || trigger == "x" || trigger == "×" || trigger == "multiply")
        id = "multiply"
    else if (trigger == "c" || trigger == "C")
        id = "C"
    else if (trigger == "Enter" || trigger == "=" || trigger == "equals")
        id = "equals"
    else if (trigger == "Backspace" || trigger == "backspace")
        id = "backspace"
    else if (trigger == "+" || trigger == "add")
        id = "add"
    else if (trigger == "-" || trigger == "subtract")
        id = "subtract"
    else if (trigger == "/" || trigger == "÷" || trigger == "divide")
        id = "divide"
    else if (trigger == "%" || trigger == "percent")
        id = "percent"
    else if (trigger == "." || trigger == "decimal")
        id = "decimal"
    else if (isNaN(Number(trigger)))
        id = "ERROR"
    return id
}

// Animates buttons when pressed/clicked.
let animationTrigger
let mouseDown = false
$(document).on("mousedown", function(event) {
    mouseDown = true
    animationTrigger = event.target.id
    animationTrigger = triggerId(animationTrigger)
    if ($("#" + animationTrigger).attr("name") == "button" && keyDown == "") {
        animate(animationTrigger, "down")
    }
})
$(document).on("mouseup", function() {
    mouseDown = false
    if ($("#" + animationTrigger).attr("name") == "button" && keyDown == "") {
        animate(animationTrigger, "up")
        if (animationTrigger != "showHistory" && animationTrigger.slice(0, animationTrigger.length -1 ) != "histButton")
            read($("#" + animationTrigger).html())
    }  
})
function animate (Id, pressDirection) {
    let buttonDOM = $("#" + Id)[0]
    if (buttonDOM == undefined)
        return
    if (pressDirection == "down") 
        buttonDOM.style.borderStyle = "inset"
    else {
        buttonDOM.style.borderStyle = "outset"
        buttonDOM.style.color = savedColor[Id]
        buttonDOM.style.backgroundColor = savedBackground[Id]
        return
    }
    let backgroundColorLen = savedBackground[Id].length
    let backgroundColorVal = [""]
    let backgroundColorValIndex = 0
    for (let i = 4; i < backgroundColorLen; i++) {
        if (!isNaN(Number(savedBackground[Id][i]))) 
            backgroundColorVal[backgroundColorValIndex] = backgroundColorVal[backgroundColorValIndex] + savedBackground[Id][i]
        else if (savedBackground[Id][i] == ",") {
            backgroundColorValIndex++
            backgroundColorVal.push("")
        }
    }
    for (let i = 0; i < 3; i++) 
        backgroundColorVal[i] = Number(backgroundColorVal[i]) - 100
        
    let colorLen = savedColor[Id].length
    let colorVal = [""]
    let colorValIndex = 0
    for (let i = 4; i < colorLen; i++) {
        if (!isNaN(Number(savedColor[Id][i]))) 
            colorVal[colorValIndex] = colorVal[colorValIndex] + savedColor[Id][i]
        else if (savedColor[Id][i] == ",") {
            colorValIndex++
            colorVal.push("")
        }
    }
    for (let i = 0; i < 3; i++) 
        colorVal[i] = Number(colorVal[i]) - 100

    buttonDOM.style.color = "rgb(" + colorVal[0] + "," + colorVal[1] + "," + colorVal[2] + ")"
    buttonDOM.style.backgroundColor = "rgb(" + backgroundColorVal[0] + "," + backgroundColorVal[1] + "," + backgroundColorVal[2] + ")"
}

// Returns 0 if value is a mathematical operator, 1 if it's a number/numeric syntax, 2 if it's paranthesis, 3 if it's misc syntax, and -1 if it's neither.
function typeId (value) {
    if (value != undefined) {
        if (value == "\n" || value == "\r")
            return 3
        if (!isNaN(Number(value)) || value == "%" || value == "." || value == "," || value == "e")
            return 1
        if (value == "(" || value == ")") 
            return 2
        let operators = ["×", "+", "÷", "/", "-", "*"]
        let operatorsLen = operators.length
        for (let i = 0; i < operatorsLen; i++) {
            if (value == operators[i])
                return 0
        }
    }
    return -1
}