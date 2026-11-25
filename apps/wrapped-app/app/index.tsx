import { View } from 'react-native';
import WrappedDom from '../src/dom/WrappedDom';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0e0a14' }}>
      <WrappedDom dom={{ style: { flex: 1 } }} />
    </View>
  );
}
