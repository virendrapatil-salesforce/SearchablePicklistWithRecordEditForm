import { LightningElement, wire, api } from 'lwc';
import getPicklists from '@salesforce/apex/customPicklistUtility.getPicklistValues';

export default class SearchablePicklist extends LightningElement {
    picklistVal;
    serverSidePiclistVal;
    isExpanded = false;
    hasFocus = false;
    blurTimeout;
    @api selectedValue = '';
    @api objectname;
    @api fieldname;
    @api fieldlabel;
    @api objectRecordId = '';
    @api required = false;
    @api multiselect = false;
    arr_originalVal = [];
    bDisabled = false;
    formElementClasses = "slds-form-element";
    bshowErrorHelpText = false;
    selectedValues = [];


    connectedCallback() {
        this.handleLoad(); // invoke Apex Class to get the picklist values.
    }
    handleLoad() {
        getPicklists({ sObjectName: this.objectname, fieldName: this.fieldname })
            .then(result => {
                this.picklistVal = result;
                this.serverSidePiclistVal = result;
                this.serverSidePiclistVal.forEach(ele => {
                    this.arr_originalVal.push(ele.value.toLowerCase().trim());
                })
            })
            .catch(error => {
                if (Array.isArray(error.body)) {
                    let errorMsg = error.body.map(e => e.message).join(', ');
                    console.error('Check error here ...', errorMsg);
                } else if (typeof error.body.message === 'string') {
                    let errorMsg = error.body.message;
                    console.error('Check error here ...', errorMsg);
                }

            })
    }
    /*
        CallSetFieldValue - Callers : Ksc_Case360, ClonedCase360 LWC Components
            Multiselect : 1) this.multiselect is true
                            2) check if the value coming from Parent is blank, if blank reset this.selectedValues array.
                            3) if the value coming from Parent is not blank, set this.selectedValues with incoming array, also set this.selectedValue as X Option(s) selected.
            Single-Select:1) If value coming from Parent is blank then set blank, otherwise set incoming value.              
    */
    @api callSetFieldValue(value) {
        // Child Method exposed to parent, to sent field value in case of Edit Form.
        if (this.multiselect == "true" || this.multiselect == true) {
            if (value == "" || value == undefined) {
                this.selectedValues = [];
            }
            else {
                let inp_arr = [];
                inp_arr = value.split(";");
                this.selectedValues = inp_arr;
            }
            let counter = this.selectedValues.length;
            this.selectedValue = counter + ' Option(s) selected';
        }
        else {
            this.selectedValue = value;
        }

    }

    /*
        callSetAsRequiredField - Callers : Ksc_Case360, ClonedCase360 LWC Components
            Multiselect : 1) expected value, true or false
                            2) if true, show asteric next to field label (red asteric)
                            3) if true, set required = true on html inbox.
    */
    @api callSetAsRequiredField(value) {
        this.required = value;
    }

    /*
        callSetAsDisabledField - Callers : Ksc_Case360, ClonedCase360 LWC Components
            Multiselect : 1) expected value, true or false
                            2) if true, meaning field is read only, reset the inbox value i.e. this.selectedValue to blank.
                            3) if true, meaning field is read only, remove the required field class slds-has-error from inbox.
                            4) if true, meaning field is read only, hide "Complete this field." message when no value present.
    */

    @api callSetAsDisabledField(value) {
        this.bDisabled = value;
        if (value) {
            this.selectedValue = '';
            this.formElementClasses = "slds-form-element";
            this.bshowErrorHelpText = false;

            /*this.template.querySelectorAll('input').forEach(ele =>{
                if(ele.disabled){
                    if(!ele.parentElement.parentElement.className.includes('slds-hide')){
                        ele.parentElement.parentElement.classList.add('slds-hide');
                    }
                    else{
                        if(ele.parentElement.parentElement.className.includes('slds-hide')){
                            ele.parentElement.parentElement.classList.remove('slds-hide');
                        }
                    }
                }
            })*/
        }
    }



    handlePickTickOnPicklistValues() {
        if (this.multiselect == "true" || this.multiselect == true) {
            this.setMultiPicklistTickInPicklistOptions();

        }
        else {
            let tempValueSet = [];
            this.serverSidePiclistVal.forEach(ele => {
                let tempEntry = Object.assign({ selected: false }, ele);
                if (this.selectedValue) {
                    if (this.selectedValue.trim().toLowerCase() == ele.value.trim().toLowerCase()) {
                        tempEntry.selected = true;
                    }
                }

                tempValueSet.push(tempEntry);
            });
            this.picklistVal = tempValueSet;
        }

    }



    handlePicklistClick() {
        // This is event to open the Picklist Values, when user click on picklist field.
        if (!this.isExpanded) {
            this.isExpanded = true;
        }
        this.handlePickTickOnPicklistValues();
    }
    handlefocus() {
        this.hasFocus = true;
        //this.picklistVal = this.serverSidePiclistVal;

        if (!this.isExpanded) {
            this.isExpanded = true;
        }
    }
    handleblur() {
        // Set Time out so that it gives us some time to select the picklist value. (as it is firing blur event as well.);
        this.blurTimeout = window.setTimeout(() => {
            this.hasFocus = false;
            this.blurTimeout = null;
            if (this.searchTerm) {
                if (!this.arr_originalVal.has(this.selectedValue.toLowerCase().trim())) {
                    this.selectedValue = '';
                }
            }
            //Collaps picklist options from UI.
            if (this.isExpanded) {
                this.isExpanded = false;
            }
            if (this.required) {
                if (this.multiselect == "true" || this.multiselect == true) {
                    if (this.selectedValues.length < 1) {
                        this.formElementClasses = "slds-form-element slds-has-error";
                        this.bshowErrorHelpText = true;
                        this.selectedValue = "";
                    }
                    else {
                        this.formElementClasses = "slds-form-element";
                        this.bshowErrorHelpText = false;
                    }
                }
                else {
                    if (this.selectedValue == null || this.selectedValue == "" || this.selectedValue == undefined) {
                        this.formElementClasses = "slds-form-element slds-has-error";
                        this.bshowErrorHelpText = true;
                    }
                    else {
                        this.formElementClasses = "slds-form-element";
                        this.bshowErrorHelpText = false;
                    }
                }

            }
        }, 300);

    }
    handleInput(event) {
        // Handler to filter the value of Picklist when user is typing something here.
        let filterPicklistVal = [];
        let fldValueToSendToParent = '';

        let searchTerm = event.target.value;
        this.serverSidePiclistVal.forEach(entry => {
            if (entry.value.toLowerCase().trim().includes(searchTerm.toLowerCase())) {
                filterPicklistVal.push(entry);
            }
        })
        this.picklistVal = filterPicklistVal;
        this.selectedValue = searchTerm;
        if (this.selectedValue == undefined || this.selectedValue == "") {
            if (this.multiselect == "true" || this.multiselect == true) {
                this.setMultiPicklistTickInPicklistOptions();
                fldValueToSendToParent = this.selectedValues.join(";");
            }
            else {
                fldValueToSendToParent = this.selectedValue;
            }
            this.dispatchSetFieldValueEventToParent(this.fieldname, fldValueToSendToParent);
        }
    }
    handleResultClick(event) {
        // Handler to select the picklist value from options and dispatch the event to parent to update the element node.
        let optionVal = event.target.innerText;
        let tempValueSet = [];
        let fldValueToSendToParent = '';


        if (optionVal) {
            this.serverSidePiclistVal.forEach(entry => {
                if (entry.value.toLowerCase().trim() == optionVal.trim().toLowerCase()) {
                    if (this.multiselect == "true" || this.multiselect == true) {
                        if (this.selectedValues.includes(entry.value)) {
                            this.selectedValues.splice(this.selectedValues.indexOf(entry.value), 1);
                        }
                        else {
                            this.selectedValues.push(entry.value);
                        }
                    }
                    else {
                        this.selectedValue = optionVal;
                        //this.picklistVal = this.serverSidePiclistVal;
                        this.serverSidePiclistVal.forEach(entry => {
                            let tempEntry = Object.assign({ selected: false }, entry);
                            if (entry.value.toLowerCase().trim() == optionVal.toLowerCase().trim()) {
                                tempEntry.selected = true;
                            }
                            tempValueSet.push(tempEntry);
                        });
                        this.picklistVal = tempValueSet;
                    }
                }
            })
        }


        if (this.multiselect == "true" || this.multiselect == true) {
            this.setMultiPicklistTickInPicklistOptions();
            fldValueToSendToParent = this.selectedValues.join(";");
        }
        else {
            fldValueToSendToParent = this.selectedValue;
            //Send Event to parent to set the new value.
        }

        this.dispatchSetFieldValueEventToParent(this.fieldname, fldValueToSendToParent);


        if (this.isExpanded) {
            this.isExpanded = false;
        }
    }
    closePill(event) {
        let val = event.currentTarget.name;
        let fldValueToSendToParent = '';

        this.addremoveMultiSelectedOption(val);

        fldValueToSendToParent = this.selectedValues;
        this.dispatchSetFieldValueEventToParent(this.fieldname, fldValueToSendToParent);
    }

    dispatchSetFieldValueEventToParent(fldN, fldV) {
        /*
            fldN : field API Name
            fldV : field new Value
        */
        let paramData = { fldName: fldN, fldValue: fldV };
        let ev = new CustomEvent('setfieldvalueevt', { detail: paramData });
        this.dispatchEvent(ev);
    }

    setMultiPicklistTickInPicklistOptions() {
        let tempValueSet = [];
        let counter = this.selectedValues.length;
        this.serverSidePiclistVal.forEach(entry => {
            let tempEntry = Object.assign({ selected: false }, entry);
            if (this.selectedValues.indexOf(entry.value) > -1) {
                tempEntry.selected = true;
            }
            tempValueSet.push(tempEntry);
        });
        this.picklistVal = tempValueSet;
        if (counter > 0) {
            this.selectedValue = counter + ' Option(s) selected';
        }
        else {
            this.selectedValue = "";
        }
    }

    addremoveMultiSelectedOption(val) {
        let tempValueSet = [];

        this.serverSidePiclistVal.forEach(ele => {
            let tempEntry = Object.assign({ selected: false }, ele);
            if (ele.value.toLowerCase().trim() == val.toLowerCase().trim()) {
                this.selectedValues.splice(this.selectedValues.indexOf(val), 1);
                tempEntry.selected = false;
            }
            else if (this.selectedValues.indexOf(ele.value) > -1) {
                tempEntry.selected = true;
            }
            tempValueSet.push(tempEntry);
        });
        this.picklistVal = tempValueSet;
        let counter = this.selectedValues.length;
        if (counter > 0) {
            this.selectedValue = counter + ' Option(s) selected';
        }
        else {
            this.selectedValue = "";
        }
    }

}