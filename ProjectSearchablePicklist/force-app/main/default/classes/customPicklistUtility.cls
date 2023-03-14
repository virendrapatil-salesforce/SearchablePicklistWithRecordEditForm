public without sharing class customPicklistUtility {
    @AuraEnabled(cacheable=true)
    public static List<picklistValues> getPicklistValues(String sObjectName,String fieldName){
        List<picklistValues> retVal = new List<PicklistValues>();
        
        Schema.SObjectType s = Schema.getGlobalDescribe().get(sObjectName);
        Schema.DescribesObjectResult r = s.getDescribe();
        Map<String,Schema.sObjectField> fields = r.fields.getMap();
        Schema.DescribeFieldResult fieldResult = fields.get(fieldName).getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        for(Schema.PicklistEntry picklistVal : ple){
            if(picklistVal.isActive()){
                retVal.add(new picklistValues(picklistVal.getLabel(),picklistVal.getValue()));   
            }
        }
        return retVal;
    }
    public class picklistValues implements Comparable  {
        @AuraEnabled
        public string label{get;set;}
        @AuraEnabled
        public string value{get;set;}
        
        public picklistValues(String lbl,String val){
            this.label = lbl;
            this.value = val;
        }
        public Integer compareTo(Object compareTo) {
            picklistValues compareToPickList = (picklistValues)compareTo;
            if (label == compareToPickList.label) return 0;
            if (label > compareToPickList.label) return 1;
            return -1;        
        }
        
    }
    
}