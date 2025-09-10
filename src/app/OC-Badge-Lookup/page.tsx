import PageLayout from '@/components/PageLayout';
import OCBadgeLookup from '@/components/OCBadgeLookup/OCBadgeLookup';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function OCBadgeLookupPage() {
  return (
    <PageLayout backgroundImage="/img/capyback.webp">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">OC Badge Lookup</CardTitle>
            <div className="text-gray-600 mt-2">This is purely onchain information, organised by badge. Note: Information can be delayed up to 6 hrs. The order the wallets appear is the order they were created. Top is earliest. </div>
          </CardHeader>
          <CardContent>
            <OCBadgeLookup />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
