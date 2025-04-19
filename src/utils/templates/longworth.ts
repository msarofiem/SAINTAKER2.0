export const getLongworthTemplate = (lead: any, insuranceInfo: any): string => {
  return `
    <h1>Longworth Letter</h1>
    <p>Date: ${new Date().toLocaleDateString()}</p>
    <p>Re: ${lead.firstName} ${lead.lastName}</p>
    <p>Date of Accident: ${new Date(lead.dateOfAccident).toLocaleDateString()}</p>
    
    <p>Dear ${insuranceInfo.carrierName},</p>
    
    <p>Please be advised that our firm represents ${lead.firstName} ${lead.lastName} in connection with injuries sustained in an automobile accident that occurred on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
    
    <p>This letter is to formally notify you that our client has uninsured/underinsured motorist coverage through your company, Policy Number: ${insuranceInfo.policyNumber}.</p>
    
    <p>Pursuant to the ruling in Longworth v. Van Houten, 223 N.J. Super. 174 (App. Div. 1988), we are hereby notifying you that we intend to settle with the tortfeasor's insurance carrier for the policy limits of ${insuranceInfo.tortfeasorLimit}.</p>
    
    <p>Please advise within 30 days if you wish to preserve your subrogation rights by paying the settlement amount in exchange for a subrogation assignment. If we do not hear from you within 30 days, we will assume that you have no objection to the settlement and will proceed accordingly.</p>
    
    <p>Sincerely,</p>
    <p>Sarofiem & Antoun, LLC</p>
  `;
};
