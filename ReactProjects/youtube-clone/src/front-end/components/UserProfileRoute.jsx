import { useParams } from "react-router-dom";
import UserProfilePage from "./front-end/components/UserProfilePage";

export default function UserProfileRoute() {
  const { userId } = useParams();

  return <UserProfilePage userId={userId} />;
}