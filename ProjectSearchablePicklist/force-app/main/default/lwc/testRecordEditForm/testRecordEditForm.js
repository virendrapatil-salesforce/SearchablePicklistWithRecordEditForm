import { LightningElement } from 'lwc';

export default class TestRecordEditForm extends LightningElement {
    objectApiName = 'Account';
    recordId = '001HE000001iOAvYAM';

    objFieldMap = {};// To create a property and use it to render
    readyToRender = false; // render child picklist components only when readyToRender is set to true after onLoad handler.
    fields = [
        {
            fieldApiName:'FirstName', 
            isPicklist : false
        },
        {
            fieldApiName:'LastName', 
            isPicklist : false
        },
        {
            fieldApiName:'Gender__c',
            isPicklist : true,
            fieldlabel : 'Gender'
        },
        {
            fieldApiName:'Martial_Status__c',
            isPicklist : true,
            fieldlabel : 'Martial Status'
        },
        {
            fieldApiName:'PersonEmail',
            isPicklist : false
        }
        ];
        // This is to restrict which picklist to be shown as custom picklist with searchable inputs.

    isLoaded = false;// set this to avoid recurssion.

    constructor() {
        super();
        // This event is fired by searchablepicklist component, mandatory to register this event.
        this.template.addEventListener('setfieldvalueevt', this.handleSetFieldValue.bind(this));

    }
    handleSetFieldValue(event) {
        // This handler listens to event from child on picklist value change, and set the record-edit-forms "hidden" field value to correct value.
        let temp = event.detail;
        this.template.querySelectorAll('lightning-input-field').forEach(ele => {
            if (ele.fieldName == temp.fldName) {
                ele.value = temp.fldValue;
            }
        });

    }

    handleRecordLoad(event) {
        // record edit forms, onLoad event handler. Create a object property e.g. {Stage__c : 'Closed'}
        try {
            if (!this.isLoaded) {
                this.isLoaded=true;
                this.template.querySelectorAll('lightning-input-field').forEach(ele => {
                    if (ele.fieldName) {
                        if (this.objFieldMap.hasOwnProperty(ele.fieldName)) {
                            this.objFieldMap[ele.fieldName] = ele.value;
                        }
                        else {
                            Object.defineProperty(this.objFieldMap, ele.fieldName, {
                                value: ele.value
                            });
                        }
                        this.readyToRender = true;
                        this.handleFieldValuePassing();
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }


    }

    handleFieldValuePassing() {
        //setTime out to let the component load and then send the values to child component.
        window.setTimeout(() => {
            this.template.querySelectorAll('c-searchable-picklist').forEach(ele => {
                let temp = ele.fieldname;
                let tempVal = this.objFieldMap[temp];
                console.log(temp);
                ele.callSetFieldValue(tempVal);
            });
        }, 500)

    }
    handleSubmit(event) {
        //event.preventDefault();
        const fields = event.detail.fields;
    }




}