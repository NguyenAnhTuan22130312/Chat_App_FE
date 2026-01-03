import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../store/store";

// Hook để dispatch actions có typed
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Hook để select state có typed
export const useAppSelector = useSelector.withTypes<RootState>();
