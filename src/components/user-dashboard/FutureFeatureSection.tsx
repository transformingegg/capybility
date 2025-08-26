import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FutureFeatureSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Show My Knowledge</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Coming soon: Update your online reputation and knowledge by submitting to OCID
        </p>
      </CardContent>
    </Card>
  );
}