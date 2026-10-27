import { useDispatch, useSelector } from "react-redux";

// Typed-style hooks for the app store (plain JS, so these are thin re-exports).
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
