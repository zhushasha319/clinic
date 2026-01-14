
 import {getDoctorDetails} from '@/lib/actions/doctor.actions';
 import DoctorProfileAbout from '@/components/molecules/doctorFiles/doctorFileAbout';
 import DoctorProfileTopCard from '@/components/molecules/doctorFiles/doctorProfileCard';


 interface Params {
  doctorId: string;
}


export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const doctorIdObject = params
  const { doctorId
   } = doctorIdObject;
 
  return (
    <div className="w-full flex flex-col md:flex-row justify-between">
      <div className="flex flex-col gap-6 md:gap-8 md:max-w-[908px] p-8">
        <div><DoctorProfileTopCard doctorId={doctorId}></DoctorProfileTopCard></div>
        <div className="md:hidden">Appoint Scheduler</div>
        <div><DoctorProfileAbout name={doctorId} brief="Brief about the doctor"></DoctorProfileAbout></div>
        <div>Reviews</div>
      </div>
      <div className="hidden md:block">Appoint Scheduler</div>
    </div>
  );
}