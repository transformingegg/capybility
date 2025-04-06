import { sectionStyles } from "@/utils/styles";

export default function FutureFeatureSection() {
  return (
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">Show My Knowledge</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">
          Coming soon: Update your online reputation and knowledge by submitting to OCID
        </p>
      </div>
    </div>
  );
}